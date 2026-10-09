/**
 * urlAnalyzer.js
 * ──────────────
 * Facade service for URL parsing, normalization, and heuristic threat evaluation.
 * Delegates to pure domain engines in server/src/domain/urlNormalization.js
 * and server/src/domain/urlHeuristics.js.
 */

import {
  safeParseUrl,
  isIpAddress,
  extractRootDomain,
  normalizeUrl,
} from '../domain/urlNormalization.js';

import {
  URL_SHORTENERS,
  SUSPICIOUS_TLDS,
  BRAND_KEYWORDS,
  OFFICIAL_BRAND_DOMAINS,
  URGENCY_KEYWORDS,
  extractUrlFeatures,
  evaluateUrlHeuristics,
} from '../domain/urlHeuristics.js';

// Backward compatibility alias for legacy tests and callers
export const parseUrlFeatures = extractUrlFeatures;
export const runHeuristicChecks = evaluateUrlHeuristics;

export {
  safeParseUrl,
  isIpAddress,
  extractRootDomain,
  normalizeUrl,
  extractUrlFeatures,
  evaluateUrlHeuristics,
  URL_SHORTENERS,
  SUSPICIOUS_TLDS,
  BRAND_KEYWORDS,
  OFFICIAL_BRAND_DOMAINS,
  URGENCY_KEYWORDS,
};

export default {
  URL_SHORTENERS,
  SUSPICIOUS_TLDS,
  BRAND_KEYWORDS,
  OFFICIAL_BRAND_DOMAINS,
  URGENCY_KEYWORDS,
  safeParseUrl,
  isIpAddress,
  extractRootDomain,
  normalizeUrl,
  parseUrlFeatures,
  runHeuristicChecks,
};
