import prisma from '../utils/prismaClient.js';
import logger from '../utils/logger.js';
import { runHeuristicChecks } from './urlAnalyzer.js';
import { checkSafeBrowsing } from './safeBrowsing.js';
import { analyzeUrlWithGemini, analyzeMessageWithGemini } from './geminiAnalyzer.js';

/**
 * Persists an analysis report to SQLite via Prisma.
 * Never throws — returns null on database failure to ensure user gets analysis results.
 */
async function persistThreatCheck({
  inputType,
  userInput,
  riskLevel,
  aiAnalysis,
  safeBrowsing,
}) {
  try {
    return await prisma.threatCheck.create({
      data: {
        inputType,
        userInput,
        riskLevel,
        threatType: aiAnalysis.threatType || 'unknown',
        confidence: typeof aiAnalysis.confidence === 'number' ? aiAnalysis.confidence : null,
        summary: aiAnalysis.summary || null,
        evidenceJson: JSON.stringify(aiAnalysis.evidence || []),
        recommendedAction: aiAnalysis.recommendedAction || null,
        safetyStepsJson: JSON.stringify(aiAnalysis.safetySteps || []),
        safeBrowsingResult: safeBrowsing ? JSON.stringify(safeBrowsing) : null,
        safetyRecommendations: {
          create: (aiAnalysis.safetySteps || []).map((action) => ({
            action,
            completed: false,
          })),
        },
      },
      include: {
        safetyRecommendations: true,
      },
    });
  } catch (err) {
    logger.warn(`Could not persist threat check to SQLite: ${err.message}`);
    return null;
  }
}

/**
 * Analyzes a URL target through the multi-stage threat analysis pipeline.
 */
export async function analyzeUrlTarget(rawUrl) {
  const trimmed = rawUrl.trim();

  // 1. Run local deterministic heuristic checks
  const heuristics = runHeuristicChecks(trimmed);
  const features = heuristics.features;
  const urlToCheck = features.valid ? features.normalized : trimmed;

  // 2. Query Google Safe Browsing reputation lookup
  const safeBrowsing = await checkSafeBrowsing(urlToCheck);

  // 3. Synthesize with Gemini AI structured analysis (or heuristic fallback)
  const aiAnalysis = await analyzeUrlWithGemini(urlToCheck, heuristics, safeBrowsing);

  // 4. Deterministic reconciliation: Heuristics and Safe Browsing take precedence
  let finalRiskLevel = aiAnalysis.riskLevel || heuristics.riskLevel;

  if (safeBrowsing.status === 'threat' || heuristics.riskLevel === 'high_risk') {
    finalRiskLevel = 'high_risk';
  } else if (heuristics.riskLevel === 'suspicious' && finalRiskLevel === 'safe') {
    finalRiskLevel = 'suspicious';
  }

  // 5. Structure "Why this result?" breakdown
  const whyThisResult = {
    deterministicChecks: {
      score: heuristics.score,
      riskLevel: heuristics.riskLevel,
      findingsCount: heuristics.findings?.length || 0,
      findings: heuristics.findings || [],
    },
    externalReputation: {
      provider: 'Google Safe Browsing Lookup v4',
      status: safeBrowsing.status,
      threats: safeBrowsing.threats || [],
      checkedAt: safeBrowsing.checkedAt,
      details: safeBrowsing.details || safeBrowsing.error,
    },
    aiInterpretation: {
      summary: aiAnalysis.summary,
      evidence: aiAnalysis.evidence,
      threatType: aiAnalysis.threatType,
      confidence: aiAnalysis.confidence,
    },
    limitations: [
      heuristics.limitations,
      aiAnalysis.limitations,
      safeBrowsing.status === 'unavailable'
        ? 'Safe Browsing reputation is currently unavailable; results rely on heuristics and AI interpretation.'
        : 'Safe Browsing clean status does not guarantee zero risk for zero-day domains.',
    ].filter(Boolean),
  };

  // 6. Persist to database
  const saved = await persistThreatCheck({
    inputType: 'url',
    userInput: trimmed,
    riskLevel: finalRiskLevel,
    aiAnalysis,
    safeBrowsing,
  });

  return {
    id: saved ? saved.id : null,
    inputType: 'url',
    raw: trimmed,
    normalized: features.valid ? features.normalized : null,
    riskLevel: finalRiskLevel,
    score: heuristics.score,
    threatType: aiAnalysis.threatType,
    confidence: aiAnalysis.confidence,
    summary: aiAnalysis.summary,
    evidence: aiAnalysis.evidence,
    recommendedAction: aiAnalysis.recommendedAction,
    safetySteps: aiAnalysis.safetySteps,
    safetyRecommendations: saved ? saved.safetyRecommendations : (aiAnalysis.safetySteps || []).map((action, i) => ({
      id: `fallback-${i}`,
      action,
      completed: false,
    })),
    needsHumanConfirmation: aiAnalysis.needsHumanConfirmation,
    heuristics: {
      score: heuristics.score,
      riskLevel: heuristics.riskLevel,
      findings: heuristics.findings,
    },
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
    safeBrowsing: {
      status: safeBrowsing.status,
      threats: safeBrowsing.threats,
      error: safeBrowsing.error,
      checkedAt: safeBrowsing.checkedAt,
      details: safeBrowsing.details,
    },
    aiAnalysis,
    whyThisResult,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Analyzes a message target through the threat analysis pipeline.
 */
export async function analyzeMessageTarget(rawMessage) {
  const trimmed = rawMessage.trim();

  // 1. Analyze message using Gemini AI with fallback
  const aiAnalysis = await analyzeMessageWithGemini(trimmed);

  // 2. Structure "Why this result?" breakdown
  const whyThisResult = {
    deterministicChecks: {
      score: aiAnalysis.riskLevel === 'high_risk' ? 90 : aiAnalysis.riskLevel === 'suspicious' ? 50 : 10,
      riskLevel: aiAnalysis.riskLevel,
      findingsCount: aiAnalysis.evidence.length,
      findings: aiAnalysis.evidence.map((e) => ({ label: 'Observed Indicator', detail: e })),
    },
    externalReputation: {
      provider: 'N/A (Message Payload)',
      status: 'unavailable',
      threats: [],
      checkedAt: Date.now(),
      details: 'Reputation blacklists apply to domain names and URLs, not raw text messages.',
    },
    aiInterpretation: {
      summary: aiAnalysis.summary,
      evidence: aiAnalysis.evidence,
      threatType: aiAnalysis.threatType,
      confidence: aiAnalysis.confidence,
    },
    limitations: [
      aiAnalysis.limitations,
      'Message analysis detects structural persuasion and fraud triggers. It cannot verify real-world sender identity.',
    ].filter(Boolean),
  };

  // 3. Persist to database
  const saved = await persistThreatCheck({
    inputType: 'message',
    userInput: trimmed,
    riskLevel: aiAnalysis.riskLevel,
    aiAnalysis,
    safeBrowsing: null,
  });

  return {
    id: saved ? saved.id : null,
    inputType: 'message',
    raw: trimmed,
    riskLevel: aiAnalysis.riskLevel,
    threatType: aiAnalysis.threatType,
    confidence: aiAnalysis.confidence,
    summary: aiAnalysis.summary,
    evidence: aiAnalysis.evidence,
    recommendedAction: aiAnalysis.recommendedAction,
    safetySteps: aiAnalysis.safetySteps,
    safetyRecommendations: saved ? saved.safetyRecommendations : (aiAnalysis.safetySteps || []).map((action, i) => ({
      id: `fallback-${i}`,
      action,
      completed: false,
    })),
    needsHumanConfirmation: aiAnalysis.needsHumanConfirmation,
    aiAnalysis,
    whyThisResult,
    analyzedAt: new Date().toISOString(),
  };
}

export default {
  analyzeUrlTarget,
  analyzeMessageTarget,
};
