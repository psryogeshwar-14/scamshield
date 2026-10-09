/**
 * safetyHelpers.js
 * ────────────────
 * Shared helper functions for safety recommendations, checklists,
 * and security advisory formatting on the ScamShield client.
 */

/**
 * Extracts and normalizes safety recommendation steps from an analysis result object.
 * Supports both relational records (safetyRecommendations) and raw arrays (safetySteps).
 *
 * @param {Object|null} result - Threat analysis result or history record
 * @returns {Array<{id: string, action: string, completed: boolean}>}
 */
export function extractSafetySteps(result) {
  if (!result) return [];

  // Relational safetyRecommendations array
  if (Array.isArray(result.safetyRecommendations) && result.safetyRecommendations.length > 0) {
    return result.safetyRecommendations.map((r) => ({
      id: r.id,
      action: r.action,
      completed: Boolean(r.completed),
    }));
  }

  // Serialized JSON safetySteps
  if (typeof result.safetyStepsJson === 'string') {
    try {
      const parsed = JSON.parse(result.safetyStepsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((action, idx) => ({
          id: `step-${idx}`,
          action: String(action),
          completed: false,
        }));
      }
    } catch {
      // Fallback below
    }
  }

  // Array safetySteps (direct from live scan API response)
  if (Array.isArray(result.safetySteps) && result.safetySteps.length > 0) {
    return result.safetySteps.map((step, idx) => ({
      id: `step-${idx}`,
      action: String(step),
      completed: false,
    }));
  }

  return [];
}

/**
 * Formats a plain-text security advisory suitable for copying to clipboard or messaging.
 *
 * @param {Object} data - Threat analysis result
 * @returns {string} Formatted advisory text
 */
export function formatSecurityAdvisory(data) {
  if (!data) return '';

  const threatName = (data.threatType || 'threat').replace(/_/g, ' ').toUpperCase();
  const risk = (data.riskLevel || 'UNKNOWN').toUpperCase();
  const action = data.recommendedAction || 'Exercise caution.';
  const summary = data.summary || '';

  return `🚨 *SCAMSHIELD SECURITY ADVISORY* 🚨\nRisk Level: ${risk}\nThreat Classification: ${threatName}\n\n⚠️ Immediate Directive:\n${action}\n\n💡 Plain-Language Summary:\n${summary}\n\nProtected by ScamShield AI Digital Safety Assistant`;
}

/**
 * Creates a downloadable JSON file Blob and triggers a browser download.
 *
 * @param {Object} data - Threat analysis result
 * @param {string} [filename] - Target filename
 */
export function downloadJsonReport(data, filename) {
  if (!data) return;
  const name = filename || `scamshield-report-${data.id || 'scan'}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default {
  extractSafetySteps,
  formatSecurityAdvisory,
  downloadJsonReport,
};
