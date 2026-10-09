/**
 * resultAssembler.js
 * ──────────────────
 * Pure result assembly engine for ScamShield security reports.
 * Formats canonical analysis outputs and explainable "Why this result?" breakdowns.
 */

/**
 * Assembles the "Why this result?" explainability breakdown.
 *
 * @param {Object} params
 * @param {'url'|'message'} params.inputType
 * @param {Object} [params.heuristics]
 * @param {Object} [params.safeBrowsing]
 * @param {Object} params.aiAnalysis
 * @returns {Object}
 */
export function assembleWhyThisResult({
  inputType,
  heuristics = null,
  safeBrowsing = null,
  aiAnalysis,
}) {
  if (inputType === 'url') {
    return {
      deterministicChecks: {
        score: heuristics?.score ?? 0,
        riskLevel: heuristics?.riskLevel ?? 'safe',
        findingsCount: heuristics?.findings?.length || 0,
        findings: heuristics?.findings || [],
      },
      externalReputation: {
        provider: 'Google Safe Browsing Lookup v4',
        status: safeBrowsing?.status ?? 'unavailable',
        threats: safeBrowsing?.threats || [],
        checkedAt: safeBrowsing?.checkedAt ?? Date.now(),
        details: safeBrowsing?.details || safeBrowsing?.error || 'No additional details.',
      },
      aiInterpretation: {
        summary: aiAnalysis?.summary || '',
        evidence: aiAnalysis?.evidence || [],
        threatType: aiAnalysis?.threatType || 'unknown',
        confidence: aiAnalysis?.confidence || 0.85,
      },
      limitations: [
        heuristics?.limitations,
        aiAnalysis?.limitations,
        safeBrowsing?.status === 'unavailable'
          ? 'Safe Browsing reputation is currently unavailable; results rely on heuristics and AI interpretation.'
          : 'Safe Browsing clean status does not guarantee zero risk for zero-day domains.',
      ].filter(Boolean),
    };
  }

  // inputType === 'message'
  const risk = aiAnalysis?.riskLevel || 'safe';
  const score = risk === 'high_risk' ? 90 : risk === 'suspicious' ? 50 : 10;

  return {
    deterministicChecks: {
      score,
      riskLevel: risk,
      findingsCount: aiAnalysis?.evidence?.length || 0,
      findings: (aiAnalysis?.evidence || []).map((e) => ({ label: 'Observed Indicator', detail: e })),
    },
    externalReputation: {
      provider: 'N/A (Message Payload)',
      status: 'unavailable',
      threats: [],
      checkedAt: Date.now(),
      details: 'Reputation blacklists apply to domain names and URLs, not raw text messages.',
    },
    aiInterpretation: {
      summary: aiAnalysis?.summary || '',
      evidence: aiAnalysis?.evidence || [],
      threatType: aiAnalysis?.threatType || 'unknown',
      confidence: aiAnalysis?.confidence || 0.85,
    },
    limitations: [
      aiAnalysis?.limitations,
      'Message analysis detects structural persuasion and fraud triggers. It cannot verify real-world sender identity.',
    ].filter(Boolean),
  };
}

/**
 * Creates in-memory fallback recommendation items if database persistence is unavailable.
 *
 * @param {Array<string>} safetySteps
 * @returns {Array<{id: string, action: string, completed: boolean}>}
 */
export function generateFallbackRecommendations(safetySteps = []) {
  return (safetySteps || []).map((action, i) => ({
    id: `fallback-${i}`,
    action,
    completed: false,
  }));
}

/**
 * Assembles the full canonical response object for a URL security analysis.
 *
 * @param {Object} params
 * @returns {Object} Canonical URL analysis payload
 */
export function assembleUrlAnalysisResult({
  id = null,
  rawUrl,
  normalizedUrl = null,
  riskLevel,
  threatType,
  confidence,
  summary,
  evidence,
  recommendedAction,
  safetySteps,
  safetyRecommendations = [],
  needsHumanConfirmation = false,
  heuristics,
  features = null,
  safeBrowsing,
  aiAnalysis,
  whyThisResult,
}) {
  return {
    id,
    inputType: 'url',
    raw: rawUrl,
    normalized: normalizedUrl,
    riskLevel,
    score: heuristics.score,
    threatType,
    confidence,
    summary,
    evidence,
    recommendedAction,
    safetySteps,
    safetyRecommendations: safetyRecommendations.length > 0
      ? safetyRecommendations
      : generateFallbackRecommendations(safetySteps),
    needsHumanConfirmation,
    heuristics: {
      score: heuristics.score,
      riskLevel: heuristics.riskLevel,
      findings: heuristics.findings,
    },
    features,
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
 * Assembles the full canonical response object for a message security analysis.
 *
 * @param {Object} params
 * @returns {Object} Canonical message analysis payload
 */
export function assembleMessageAnalysisResult({
  id = null,
  rawMessage,
  riskLevel,
  threatType,
  confidence,
  summary,
  evidence,
  recommendedAction,
  safetySteps,
  safetyRecommendations = [],
  needsHumanConfirmation = false,
  aiAnalysis,
  whyThisResult,
}) {
  return {
    id,
    inputType: 'message',
    raw: rawMessage,
    riskLevel,
    threatType,
    confidence,
    summary,
    evidence,
    recommendedAction,
    safetySteps,
    safetyRecommendations: safetyRecommendations.length > 0
      ? safetyRecommendations
      : generateFallbackRecommendations(safetySteps),
    needsHumanConfirmation,
    aiAnalysis,
    whyThisResult,
    analyzedAt: new Date().toISOString(),
  };
}

export default {
  assembleWhyThisResult,
  generateFallbackRecommendations,
  assembleUrlAnalysisResult,
  assembleMessageAnalysisResult,
};
