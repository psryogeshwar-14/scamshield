import { RISK_LEVELS, THREAT_TYPES } from '../constants/threatTypes.js';

/**
 * geminiValidation.js
 * ───────────────────
 * Pure validation and sanitization for Gemini AI structured responses.
 * Guarantees that even if the AI hallucinates unexpected formats or missing fields,
 * the application receives valid, clean, type-safe security data.
 */

const ALLOWED_RISK_LEVELS = new Set(Object.values(RISK_LEVELS));
const ALLOWED_THREAT_TYPES = new Set(Object.values(THREAT_TYPES));

/**
 * Validates and sanitizes raw JSON parsed from Gemini against strict application schemas.
 *
 * @param {Object} data - Raw JSON from Gemini model output
 * @param {'url'|'message'} [inputType='message'] - Target input type
 * @returns {Object} Sanitized, fully populated Gemini analysis object
 */
export function validateAndSanitizeGeminiResponse(data, inputType = 'message') {
  const safeInputType = inputType === 'url' ? 'url' : 'message';

  const riskLevel = data?.riskLevel && ALLOWED_RISK_LEVELS.has(data.riskLevel)
    ? data.riskLevel
    : RISK_LEVELS.SUSPICIOUS;

  const threatType = data?.threatType && ALLOWED_THREAT_TYPES.has(data.threatType)
    ? data.threatType
    : THREAT_TYPES.UNKNOWN;

  let confidence = 0.85;
  if (typeof data?.confidence === 'number' && !isNaN(data.confidence)) {
    confidence = Math.max(0.1, Math.min(1.0, Math.round(data.confidence * 100) / 100));
  }

  const summary = typeof data?.summary === 'string' && data.summary.trim().length > 0
    ? data.summary.trim()
    : 'Safety evaluation completed based on structural and contextual indicators.';

  const evidence = Array.isArray(data?.evidence) && data.evidence.length > 0
    ? data.evidence.map((item) => String(item).trim()).filter(Boolean)
    : ['Standard pattern evaluation conducted.'];

  const recommendedAction = typeof data?.recommendedAction === 'string' && data.recommendedAction.trim().length > 0
    ? data.recommendedAction.trim()
    : 'Do not click links or share credentials until independently verified.';

  const safetySteps = Array.isArray(data?.safetySteps) && data.safetySteps.length > 0
    ? data.safetySteps.map((step) => String(step).trim()).filter(Boolean)
    : [
        'Never disclose passwords, OTPs, or financial pins to unverified callers or messages',
        'Check account status through official websites or applications directly',
      ];

  const limitations = typeof data?.limitations === 'string' && data.limitations.trim().length > 0
    ? data.limitations.trim()
    : 'Automated guidance based on pattern analysis; not a substitute for official organizational IT counsel.';

  return {
    inputType: safeInputType,
    riskLevel,
    threatType,
    confidence,
    summary,
    evidence,
    recommendedAction,
    safetySteps,
    needsHumanConfirmation: Boolean(data?.needsHumanConfirmation),
    limitations,
  };
}

/**
 * Constructs prompt for Gemini message threat analysis.
 *
 * @param {string} message - User submitted message
 * @returns {string} Formatted prompt
 */
export function buildMessageAnalysisPrompt(message) {
  return `
Analyze the following user-submitted message for security threats and scams.

User Message:
"""
${message}
"""

Evaluate for scams (phishing, OTP fraud, payment scams, fake jobs, impersonation, malware).
Explain in simple terms for students and return strictly according to responseSchema.
`.trim();
}

/**
 * Constructs prompt for Gemini URL threat analysis grounded in factual heuristic evidence.
 *
 * @param {string} url - Target URL
 * @param {Object} heuristics - Local heuristic findings and score
 * @param {Object} safeBrowsing - Google Safe Browsing response
 * @returns {string} Formatted prompt
 */
export function buildUrlAnalysisPrompt(url, heuristics, safeBrowsing) {
  return `
Explain the security posture of this URL based on the factual evidence provided below.
DO NOT invent facts not supported by the evidence.

Target URL: ${url}

Heuristic Score: ${heuristics.score}/100
Heuristic Risk Level: ${heuristics.riskLevel}
Heuristic Findings:
${JSON.stringify(heuristics.findings || [], null, 2)}

URL Features:
${JSON.stringify(heuristics.features || {}, null, 2)}

Google Safe Browsing Status:
${JSON.stringify(safeBrowsing, null, 2)}

Explain why this URL is safe, suspicious, or high_risk in simple language for students.
Return strictly according to responseSchema.
`.trim();
}

export default {
  validateAndSanitizeGeminiResponse,
  buildMessageAnalysisPrompt,
  buildUrlAnalysisPrompt,
};
