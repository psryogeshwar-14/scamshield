import logger from '../utils/logger.js';
import { evaluateUrlHeuristics } from '../domain/urlHeuristics.js';
import { evaluateMessageSignals } from '../domain/messageSignals.js';
import { reconcileRiskLevel, resolveThreatType, calculateConfidence } from '../domain/riskClassification.js';
import { querySafeBrowsing } from '../integrations/safeBrowsingClient.js';
import { callGeminiForUrl, callGeminiForMessage } from '../integrations/geminiClient.js';
import {
  assembleWhyThisResult,
  assembleUrlAnalysisResult,
  assembleMessageAnalysisResult,
} from '../domain/resultAssembler.js';
import { createThreatCheckRecord } from '../repositories/threatCheckRepository.js';

/**
 * analysisPipeline.js
 * ───────────────────
 * Canonical 9-stage analysis execution pipeline for ScamShield.
 *
 * Pipeline sequence:
 * 1. Input Validation
 * 2. Normalization
 * 3. Deterministic Analysis
 * 4. Safe Browsing Lookup
 * 5. Gemini Interpretation
 * 6. Gemini Response Validation
 * 7. Final Risk Classification & Reconciliation
 * 8. Persistence (Repository Layer)
 * 9. Response Assembly
 */

/**
 * Generates deterministic fallback analysis for a message if Gemini is unavailable.
 *
 * @param {string} rawMessage
 * @returns {Object}
 */
export function generateMessageFallback(rawMessage) {
  const signalResult = evaluateMessageSignals(rawMessage);
  return {
    inputType: 'message',
    riskLevel: signalResult.riskLevel,
    threatType: signalResult.threatType,
    confidence: signalResult.confidence,
    summary: signalResult.summary,
    evidence: signalResult.evidence,
    recommendedAction: signalResult.recommendedAction,
    safetySteps: signalResult.safetySteps,
    needsHumanConfirmation: signalResult.needsHumanConfirmation,
    limitations: signalResult.limitations,
  };
}

/**
 * Generates deterministic fallback analysis for a URL if Gemini is unavailable.
 *
 * @param {string} url
 * @param {Object} heuristics
 * @param {Object} safeBrowsing
 * @returns {Object}
 */
export function generateUrlFallback(url, heuristics, safeBrowsing) {
  const isHighRisk = heuristics.riskLevel === 'high_risk' || safeBrowsing.status === 'threat';
  const isSuspicious = heuristics.riskLevel === 'suspicious';

  const evidenceList = (heuristics.findings || []).map((f) => `${f.label}: ${f.detail}`);
  if (safeBrowsing.status === 'threat') {
    evidenceList.unshift('Flagged as active threat in Google Safe Browsing threat lists');
  }

  if (isHighRisk) {
    const isBrand = heuristics.features?.brandMatches?.length > 0;
    const threatType = isBrand ? 'impersonation' : safeBrowsing.status === 'threat' ? 'malware' : 'phishing';

    return {
      inputType: 'url',
      riskLevel: 'high_risk',
      threatType,
      confidence: Math.min(0.98, Math.max(0.85, (heuristics.score || 80) / 100)),
      summary: `This web link displays critical hazard indicators: ${evidenceList.slice(0, 2).join('; ')}. It likely attempts to deceive visitors or harvest credentials.`,
      evidence: evidenceList.length > 0 ? evidenceList : ['Dangerous domain structural indicators observed'],
      recommendedAction: 'Do not visit this site or input any credentials or personal information.',
      safetySteps: [
        'Do not open this URL in your web browser',
        'Never submit student ID numbers, passwords, or credit card details on this domain',
        'If shared in a campus group chat, warn peers about the threat',
        'Report this URL to your university IT support and Google Safe Browsing',
      ],
      needsHumanConfirmation: false,
      limitations: 'Analysis synthesized from structural heuristics and reputation signals.',
    };
  }

  if (isSuspicious) {
    return {
      inputType: 'url',
      riskLevel: 'suspicious',
      threatType: 'unknown',
      confidence: 0.75,
      summary: 'This URL contains structural anomalies such as unencrypted HTTP, an unusual top-level domain, or multiple subdomains. Proceed with caution.',
      evidence: evidenceList.length > 0 ? evidenceList : ['Unusual structural URL attributes observed'],
      recommendedAction: 'Avoid entering sensitive credentials or making payments on this website.',
      safetySteps: [
        'Confirm the domain precisely matches the organization you intended to visit',
        'Ensure communication is protected by valid HTTPS encryption',
        'If redirected to a login portal, open the service from a trusted bookmark instead',
      ],
      needsHumanConfirmation: true,
      limitations: 'Heuristic analysis flags syntactic anomalies; human verification recommended.',
    };
  }

  return {
    inputType: 'url',
    riskLevel: 'safe',
    threatType: 'unknown',
    confidence: 0.92,
    summary: 'No suspicious security signals were flagged in this URL. The protocol, hostname structure, and domain attributes appear legitimate.',
    evidence: evidenceList.length > 0 ? evidenceList : ['Standard domain format', 'No suspicious structural indicators flagged'],
    recommendedAction: 'The link appears safe to browse. Maintain normal digital safety practices.',
    safetySteps: [
      'Verify the browser address bar still shows the expected domain after loading',
      'Never input passwords if you are unexpectedly redirected to another domain',
    ],
    needsHumanConfirmation: false,
    limitations: 'Heuristic analysis cannot detect zero-day exploits or newly compromised websites.',
  };
}

/**
 * Executes the canonical 9-stage analysis pipeline for a URL target.
 *
 * @param {string} rawUrl
 * @returns {Promise<Object>}
 */
export async function executeUrlAnalysisPipeline(rawUrl) {
  // Stage 1 & 2: Input Validation & Normalization
  const trimmed = typeof rawUrl === 'string' ? rawUrl.trim() : '';

  // Stage 3: Deterministic Analysis (Heuristics)
  const heuristics = evaluateUrlHeuristics(trimmed);
  const features = heuristics.features;
  const urlToCheck = features.valid ? features.normalized : trimmed;

  // Stage 4: Safe Browsing Lookup
  const safeBrowsing = await querySafeBrowsing(urlToCheck);

  // Stage 5 & 6: Gemini Interpretation & Response Validation
  let aiAnalysis;
  try {
    aiAnalysis = await callGeminiForUrl(urlToCheck, heuristics, safeBrowsing);
  } catch (err) {
    logger.warn(`Gemini URL analysis fallback triggered: ${err.message}`);
    aiAnalysis = generateUrlFallback(urlToCheck, heuristics, safeBrowsing);
    aiAnalysis._fallbackNote = `Analyzed using ScamShield deterministic engine (${err.message})`;
  }

  // Stage 7: Final Risk Classification & Reconciliation
  const finalRiskLevel = reconcileRiskLevel({
    heuristicsRisk: heuristics.riskLevel,
    safeBrowsingStatus: safeBrowsing.status,
    geminiRisk: aiAnalysis.riskLevel,
  });

  const finalThreatType = resolveThreatType({
    aiThreatType: aiAnalysis.threatType,
    safeBrowsingStatus: safeBrowsing.status,
    brandMatches: features.brandMatches,
  });

  const finalConfidence = calculateConfidence({
    aiConfidence: aiAnalysis.confidence,
    heuristicScore: heuristics.score,
    riskLevel: finalRiskLevel,
  });

  // Stage 8: Explainability assembly
  const whyThisResult = assembleWhyThisResult({
    inputType: 'url',
    heuristics,
    safeBrowsing,
    aiAnalysis,
  });

  // Stage 8b: Persistence via Repository Layer
  const saved = await createThreatCheckRecord({
    inputType: 'url',
    userInput: trimmed,
    riskLevel: finalRiskLevel,
    threatType: finalThreatType,
    confidence: finalConfidence,
    summary: aiAnalysis.summary,
    evidence: aiAnalysis.evidence,
    recommendedAction: aiAnalysis.recommendedAction,
    safetySteps: aiAnalysis.safetySteps,
    safeBrowsingResult: safeBrowsing,
  });

  // Stage 9: Response Assembly
  return assembleUrlAnalysisResult({
    id: saved ? saved.id : null,
    rawUrl: trimmed,
    normalizedUrl: features.valid ? features.normalized : null,
    riskLevel: finalRiskLevel,
    threatType: finalThreatType,
    confidence: finalConfidence,
    summary: aiAnalysis.summary,
    evidence: aiAnalysis.evidence,
    recommendedAction: aiAnalysis.recommendedAction,
    safetySteps: aiAnalysis.safetySteps,
    safetyRecommendations: saved?.safetyRecommendations || [],
    needsHumanConfirmation: Boolean(aiAnalysis.needsHumanConfirmation),
    heuristics,
    features: features.valid ? {
      protocol: features.protocol,
      isHttps: features.isHttps,
      hostname: features.hostname,
      rootDomain: features.rootDomain,
      tld: features.tld,
      subdomains: features.subdomains,
      subdomain_count: features.subdomain_count,
      isIpAddress: features.isIpAddress,
      isShortener: features.isShortener,
      isSuspiciousTld: features.isSuspiciousTld,
      hyphenCount: features.hyphenCount,
      digitGroupCount: features.digitGroupCount,
      hostnameLength: features.hostnameLength,
      path: features.path,
      hasQueryParams: features.hasQueryParams,
      queryParams: features.queryParams,
      brandMatches: features.brandMatches,
      urgencyMatches: features.urgencyMatches,
    } : null,
    safeBrowsing,
    aiAnalysis,
    whyThisResult,
  });
}

/**
 * Executes the canonical 9-stage analysis pipeline for a message target.
 *
 * @param {string} rawMessage
 * @returns {Promise<Object>}
 */
export async function executeMessageAnalysisPipeline(rawMessage) {
  // Stage 1 & 2: Input Validation & Normalization
  const trimmed = typeof rawMessage === 'string' ? rawMessage.trim() : '';

  // Stage 3: Deterministic Analysis (Message Signals)
  const messageSignals = evaluateMessageSignals(trimmed);

  // Stage 4: Safe Browsing Lookup (Not applicable to raw messages)
  const safeBrowsing = {
    status: 'unavailable',
    threats: [],
    checkedAt: Date.now(),
    details: 'Reputation blacklists apply to domain names and URLs, not raw text messages.',
  };

  // Stage 5 & 6: Gemini Interpretation & Response Validation
  let aiAnalysis;
  try {
    aiAnalysis = await callGeminiForMessage(trimmed);
  } catch (err) {
    logger.warn(`Gemini message analysis fallback triggered: ${err.message}`);
    aiAnalysis = generateMessageFallback(trimmed);
    aiAnalysis._fallbackNote = `Analyzed using ScamShield deterministic engine (${err.message})`;
  }

  // Stage 7: Final Risk Classification & Reconciliation
  const finalRiskLevel = reconcileRiskLevel({
    heuristicsRisk: messageSignals.riskLevel,
    safeBrowsingStatus: 'unavailable',
    geminiRisk: aiAnalysis.riskLevel,
  });

  const finalThreatType = resolveThreatType({
    aiThreatType: aiAnalysis.threatType,
    signalThreatType: messageSignals.threatType,
  });

  const finalConfidence = calculateConfidence({
    aiConfidence: aiAnalysis.confidence,
    heuristicScore: messageSignals.riskLevel === 'high_risk' ? 90 : 50,
    riskLevel: finalRiskLevel,
  });

  // Stage 8: Explainability assembly
  const whyThisResult = assembleWhyThisResult({
    inputType: 'message',
    safeBrowsing,
    aiAnalysis,
  });

  // Stage 8b: Persistence via Repository Layer
  const saved = await createThreatCheckRecord({
    inputType: 'message',
    userInput: trimmed,
    riskLevel: finalRiskLevel,
    threatType: finalThreatType,
    confidence: finalConfidence,
    summary: aiAnalysis.summary,
    evidence: aiAnalysis.evidence,
    recommendedAction: aiAnalysis.recommendedAction,
    safetySteps: aiAnalysis.safetySteps,
    safeBrowsingResult: null,
  });

  // Stage 9: Response Assembly
  return assembleMessageAnalysisResult({
    id: saved ? saved.id : null,
    rawMessage: trimmed,
    riskLevel: finalRiskLevel,
    threatType: finalThreatType,
    confidence: finalConfidence,
    summary: aiAnalysis.summary,
    evidence: aiAnalysis.evidence,
    recommendedAction: aiAnalysis.recommendedAction,
    safetySteps: aiAnalysis.safetySteps,
    safetyRecommendations: saved?.safetyRecommendations || [],
    needsHumanConfirmation: Boolean(aiAnalysis.needsHumanConfirmation),
    aiAnalysis,
    whyThisResult,
  });
}

export default {
  executeUrlAnalysisPipeline,
  executeMessageAnalysisPipeline,
  generateMessageFallback,
  generateUrlFallback,
};
