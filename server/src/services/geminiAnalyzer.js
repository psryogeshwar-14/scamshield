/**
 * geminiAnalyzer.js
 * ─────────────────
 * Facade service for Gemini AI threat analysis.
 * Delegates to geminiClient, geminiValidation, and analysisPipeline.
 */

import {
  SCAM_SHIELD_RESPONSE_SCHEMA,
  callGeminiForMessage,
  callGeminiForUrl,
} from '../integrations/geminiClient.js';
import { validateAndSanitizeGeminiResponse } from '../domain/geminiValidation.js';
import { generateMessageFallback, generateUrlFallback } from './analysisPipeline.js';
import logger from '../utils/logger.js';

// Backward compatibility alias for legacy tests and callers
export const sanitizeResult = validateAndSanitizeGeminiResponse;
export const fallbackAnalyzeMessage = generateMessageFallback;
export const fallbackAnalyzeUrl = generateUrlFallback;

export { SCAM_SHIELD_RESPONSE_SCHEMA };

/**
 * Analyzes a message with Gemini AI using structured output schema,
 * falling back gracefully to deterministic analysis on failure.
 *
 * @param {string} message
 * @returns {Promise<Object>}
 */
export async function analyzeMessageWithGemini(message) {
  try {
    return await callGeminiForMessage(message);
  } catch (err) {
    logger.warn(`Gemini message analysis fallback triggered: ${err.message}`);
    const fallback = generateMessageFallback(message);
    fallback._fallbackNote = `Analyzed using ScamShield deterministic engine (${err.message})`;
    return fallback;
  }
}

/**
 * Analyzes a URL with Gemini AI grounded on factual heuristics and Safe Browsing,
 * falling back gracefully on failure.
 *
 * @param {string} url
 * @param {Object} heuristics
 * @param {Object} safeBrowsing
 * @returns {Promise<Object>}
 */
export async function analyzeUrlWithGemini(url, heuristics, safeBrowsing) {
  try {
    return await callGeminiForUrl(url, heuristics, safeBrowsing);
  } catch (err) {
    logger.warn(`Gemini URL analysis fallback triggered: ${err.message}`);
    const fallback = generateUrlFallback(url, heuristics, safeBrowsing);
    fallback._fallbackNote = `Analyzed using ScamShield deterministic engine (${err.message})`;
    return fallback;
  }
}

export default {
  SCAM_SHIELD_RESPONSE_SCHEMA,
  sanitizeResult,
  fallbackAnalyzeMessage,
  fallbackAnalyzeUrl,
  analyzeMessageWithGemini,
  analyzeUrlWithGemini,
};
