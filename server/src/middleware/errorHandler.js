import { IS_PRODUCTION, IS_TEST } from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Creates a typed HTTP error with an HTTP status code and optional error code.
 */
export function createError(message, status = 500, code = 'INTERNAL_ERROR') {
  const err = new Error(message);
  err.status = status;
  err.statusCode = status;
  err.code = code;
  return err;
}

/**
 * Global centralized error handler middleware.
 * Ensures consistent error formatting and NEVER leaks internal stack traces to users.
 */
export function globalErrorHandler(err, req, res, _next) {
  const status = Number.isInteger(err.status) ? err.status
    : Number.isInteger(err.statusCode) ? err.statusCode
    : 500;

  let message = err.message || 'An unexpected error occurred while processing your security check.';
  let code = err.code || (status === 429 ? 'RATE_LIMITED' : status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST');
  const requestId = req?.id || 'unknown';

  // Server-side logging for diagnostics
  if (!IS_TEST) {
    logger.error(`${req.method} ${req.path} [${requestId}] failed (${status}): ${err.message}`, err);
  }

  // Friendly human-readable translation for common network and protocol issues
  if (status === 429) {
    message = 'You have submitted too many safety checks in a short period. Please pause for a few minutes before trying again.';
    code = 'RATE_LIMITED';
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    message = 'Security lookup service is currently unreachable. Please verify network connectivity and retry.';
    code = 'SERVICE_UNREACHABLE';
  } else if (err.name === 'AbortError' || err.message?.includes('timeout')) {
    message = 'Security inspection timed out. The target server or threat intelligence service was unresponsive.';
    code = 'TIMEOUT';
  } else if (err.type === 'entity.too.large') {
    message = 'Request payload exceeds maximum allowed size (50KB).';
    code = 'PAYLOAD_TOO_LARGE';
  } else if (status >= 500 && IS_PRODUCTION) {
    message = 'An internal safety analysis error occurred. Please try again in a few moments.';
    code = 'SERVER_ERROR';
  }

  res.status(status).json({
    success: false,
    error: {
      message,
      code,
      requestId,
    },
  });
}

/**
 * 404 handler for unknown routes.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      message: `The requested security endpoint does not exist: ${req.method} ${req.originalUrl}`,
      code: 'NOT_FOUND',
      requestId: req?.id || 'unknown',
    },
  });
}

export default {
  createError,
  globalErrorHandler,
  notFoundHandler,
};
