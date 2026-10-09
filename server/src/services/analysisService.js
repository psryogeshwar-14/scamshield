/**
 * analysisService.js
 * ───────────────────
 * Main business service orchestrating threat analysis workflows.
 * Delegates to the canonical 9-stage analysis pipeline (analysisPipeline.js).
 */

import {
  executeUrlAnalysisPipeline,
  executeMessageAnalysisPipeline,
} from './analysisPipeline.js';

/**
 * Analyzes a URL target through the multi-stage threat analysis pipeline.
 *
 * @param {string} rawUrl - Target URL to analyze
 * @returns {Promise<Object>} Formatted threat analysis result
 */
export async function analyzeUrlTarget(rawUrl) {
  return executeUrlAnalysisPipeline(rawUrl);
}

/**
 * Analyzes a message target through the threat analysis pipeline.
 *
 * @param {string} rawMessage - Target message text to analyze
 * @returns {Promise<Object>} Formatted threat analysis result
 */
export async function analyzeMessageTarget(rawMessage) {
  return executeMessageAnalysisPipeline(rawMessage);
}

export default {
  analyzeUrlTarget,
  analyzeMessageTarget,
};
