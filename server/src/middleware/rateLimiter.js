import rateLimit from 'express-rate-limit';
import { IS_TEST, RATE_LIMIT_CONFIG } from '../config/index.js';

/**
 * Custom rate limiter factory.
 */
function createLimiter({ windowMs, max, message }) {
  if (IS_TEST) {
    // In test environment, bypass rate limit to avoid interfering with automated test suites
    return (_req, _res, next) => next();
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    statusCode: 429,
    message: (req) => ({
      success: false,
      error: {
        message: message || 'Too many requests. Please pause before trying again.',
        code: 'RATE_LIMITED',
        requestId: req?.id || 'unknown',
      },
    }),
  });
}

/** Rate limiter for compute-heavy security analysis endpoints */
export const analyzeLimiter = createLimiter({
  windowMs: RATE_LIMIT_CONFIG.ANALYZE_WINDOW_MS,
  max: RATE_LIMIT_CONFIG.ANALYZE_MAX,
  message: 'You have submitted too many safety checks in a short period. Please pause for a few minutes before trying again.',
});

/** Rate limiter for general and history endpoints */
export const generalLimiter = createLimiter({
  windowMs: RATE_LIMIT_CONFIG.GENERAL_WINDOW_MS,
  max: RATE_LIMIT_CONFIG.GENERAL_MAX,
  message: 'Too many requests. Please slow down your requests.',
});

export default {
  analyzeLimiter,
  generalLimiter,
};
