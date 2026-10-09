import { RISK_LEVELS, THREAT_TYPES } from '../constants/threatTypes.js';

/**
 * riskClassification.js
 * ─────────────────────
 * Pure deterministic risk reconciliation engine.
 *
 * Enforces critical security invariants:
 * 1. Confirmed external threat (Google Safe Browsing) ALWAYS yields high_risk.
 * 2. Deterministic structural high_risk heuristic ALWAYS yields high_risk.
 * 3. AI cannot downgrade deterministic warnings (e.g. suspicious -> safe).
 * 4. Outputs are strictly constrained to valid RISK_LEVELS enum values.
 */

/**
 * Reconciles risk levels across deterministic heuristics, Google Safe Browsing,
 * and Gemini AI structured interpretation.
 *
 * @param {Object} params
 * @param {string} [params.heuristicsRisk] - Risk level from local deterministic heuristics ('safe' | 'suspicious' | 'high_risk')
 * @param {string} [params.safeBrowsingStatus] - Status from Safe Browsing ('clean' | 'threat' | 'unavailable')
 * @param {string} [params.geminiRisk] - Risk level proposed by Gemini ('safe' | 'suspicious' | 'high_risk')
 * @returns {string} Reconciled risk level ('safe' | 'suspicious' | 'high_risk')
 */
export function reconcileRiskLevel({
  heuristicsRisk = RISK_LEVELS.SAFE,
  safeBrowsingStatus = 'unavailable',
  geminiRisk = RISK_LEVELS.SAFE,
} = {}) {
  // Invariant 1: Confirmed Safe Browsing threat overrides everything to high_risk
  if (safeBrowsingStatus === 'threat') {
    return RISK_LEVELS.HIGH_RISK;
  }

  // Invariant 2: Deterministic heuristic high_risk cannot be downgraded by AI
  if (heuristicsRisk === RISK_LEVELS.HIGH_RISK) {
    return RISK_LEVELS.HIGH_RISK;
  }

  // Invariant 3: If heuristics flagged suspicious, AI cannot downgrade to safe
  if (heuristicsRisk === RISK_LEVELS.SUSPICIOUS && geminiRisk === RISK_LEVELS.SAFE) {
    return RISK_LEVELS.SUSPICIOUS;
  }

  // Invariant 4: If Gemini determined high_risk or suspicious, respect it
  if (geminiRisk === RISK_LEVELS.HIGH_RISK) {
    return RISK_LEVELS.HIGH_RISK;
  }

  if (geminiRisk === RISK_LEVELS.SUSPICIOUS) {
    return RISK_LEVELS.SUSPICIOUS;
  }

  // Invariant 5: Fallback to heuristics risk if valid, else safe
  if (heuristicsRisk === RISK_LEVELS.SUSPICIOUS) {
    return RISK_LEVELS.SUSPICIOUS;
  }

  return RISK_LEVELS.SAFE;
}

/**
 * Classifies threat type from multi-source signals.
 *
 * @param {Object} params
 * @param {string} [params.aiThreatType]
 * @param {string} [params.safeBrowsingStatus]
 * @param {Array<string>} [params.brandMatches]
 * @param {string} [params.signalThreatType]
 * @returns {string}
 */
export function resolveThreatType({
  aiThreatType = THREAT_TYPES.UNKNOWN,
  safeBrowsingStatus = 'clean',
  brandMatches = [],
  signalThreatType = null,
} = {}) {
  if (brandMatches && brandMatches.length > 0) {
    return THREAT_TYPES.IMPERSONATION;
  }

  if (safeBrowsingStatus === 'threat') {
    return THREAT_TYPES.MALWARE;
  }

  if (signalThreatType && Object.values(THREAT_TYPES).includes(signalThreatType)) {
    return signalThreatType;
  }

  if (aiThreatType && Object.values(THREAT_TYPES).includes(aiThreatType)) {
    return aiThreatType;
  }

  return THREAT_TYPES.UNKNOWN;
}

/**
 * Calculates a normalized confidence score between 0.10 and 1.00.
 *
 * @param {Object} params
 * @param {number} [params.aiConfidence]
 * @param {number} [params.heuristicScore]
 * @param {string} [params.riskLevel]
 * @returns {number}
 */
export function calculateConfidence({
  aiConfidence,
  heuristicScore = 50,
  riskLevel = RISK_LEVELS.SAFE,
} = {}) {
  if (typeof aiConfidence === 'number' && !isNaN(aiConfidence)) {
    return Math.max(0.1, Math.min(1.0, Math.round(aiConfidence * 100) / 100));
  }

  if (riskLevel === RISK_LEVELS.HIGH_RISK) {
    const raw = Math.min(0.98, Math.max(0.85, (heuristicScore || 80) / 100));
    return Math.round(raw * 100) / 100;
  }

  if (riskLevel === RISK_LEVELS.SUSPICIOUS) {
    return 0.75;
  }

  return 0.92;
}

export default {
  reconcileRiskLevel,
  resolveThreatType,
  calculateConfidence,
};
