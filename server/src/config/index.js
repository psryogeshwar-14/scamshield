import 'dotenv/config';

/**
 * Centralized Application Configuration.
 * Validates and exports environment settings and operational defaults.
 */

export function getPort() {
  const portNum = parseInt(process.env.PORT, 10);
  return Number.isInteger(portNum) && portNum > 0 ? portNum : 3001;
}
export const PORT = getPort();

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_TEST = NODE_ENV === 'test';

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || 'file:./prisma/dev.db';
}
export const DATABASE_URL = getDatabaseUrl();

export function getClientUrl() {
  return process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
}
export const CLIENT_URL = getClientUrl();

export function getGeminiApiKey() {
  return (process.env.GEMINI_API_KEY || '').trim();
}
export const GEMINI_API_KEY = getGeminiApiKey();

export function getSafeBrowsingApiKey() {
  return (process.env.SAFEBROWSING_API_KEY || '').trim();
}
export const SAFEBROWSING_API_KEY = getSafeBrowsingApiKey();

/**
 * Checks whether a valid Gemini API key is configured.
 */
export function isGeminiConfigured() {
  const key = getGeminiApiKey();
  return Boolean(
    key &&
    key !== 'your_gemini_api_key_here' &&
    key.length > 5
  );
}

/**
 * Checks whether a valid Google Safe Browsing API key is configured.
 */
export function isSafeBrowsingConfigured() {
  const key = getSafeBrowsingApiKey();
  return Boolean(
    key &&
    key !== 'your_google_safe_browsing_api_key_here' &&
    key.length > 5
  );
}

// Operational Timeouts (in milliseconds)
export const TIMEOUTS = {
  GEMINI_MS: 10000,       // 10 seconds timeout for Gemini API calls
  SAFE_BROWSING_MS: 5000, // 5 seconds timeout for Safe Browsing API calls
};

// Rate limiting options
export const RATE_LIMIT_CONFIG = {
  ANALYZE_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  ANALYZE_MAX: 100,                  // 100 requests per IP
  GENERAL_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  GENERAL_MAX: 300,                  // 300 requests per IP
};

export default {
  PORT,
  NODE_ENV,
  IS_PRODUCTION,
  IS_TEST,
  DATABASE_URL,
  CLIENT_URL,
  GEMINI_API_KEY,
  SAFEBROWSING_API_KEY,
  getGeminiApiKey,
  getSafeBrowsingApiKey,
  isGeminiConfigured,
  isSafeBrowsingConfigured,
  TIMEOUTS,
  RATE_LIMIT_CONFIG,
};
