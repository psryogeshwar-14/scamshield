import { IS_TEST } from '../config/index.js';
import logger from '../utils/logger.js';
import { formatApiError } from '../utils/apiError.js';
import { ERROR_CODES } from '../constants/threatTypes.js';

/**
 * Creates a typed HTTP error with an HTTP status code and optional error code.
 */
export function createError(message, status = 500, code = ERROR_CODES.INTERNAL_ERROR) {
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
  const status = Number.isInteger(err.status)
    ? err.status
    : Number.isInteger(err.statusCode)
    ? err.statusCode
    : 500;

  let message = err.message || 'An unexpected error occurred while processing your security check.';
  let code = err.code || (status === 429 ? ERROR_CODES.RATE_LIMITED : status >= 500 ? ERROR_CODES.INTERNAL_ERROR : ERROR_CODES.BAD_REQUEST);
  const requestId = req?.id || 'unknown';

  // Server-side logging for diagnostics
  if (!IS_TEST) {
    logger.error(`${req.method} ${req.path} [${requestId}] failed (${status}): ${err.message}`, err);
  }

  // Handle CORS policy violations with HTTP 403 Forbidden
  if (err.message && err.message.includes('CORS policy does not allow access')) {
    return res.status(403).json(
      formatApiError({
        code: ERROR_CODES.CORS_FORBIDDEN,
        message: 'Cross-Origin Request Blocked: Origin not permitted by ScamShield CORS policy.',
        requestId,
      })
    );
  }

  // Mask database / Prisma operational errors to prevent schema leakage
  if (err.name?.startsWith('Prisma') || (typeof err.code === 'string' && err.code.startsWith('P'))) {
    return res.status(500).json(
      formatApiError({
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'A secure database operation could not be completed.',
        requestId,
      })
    );
  }

  // Friendly human-readable translation for common network and protocol issues
  if (status === 429) {
    message = 'You have submitted too many safety checks in a short period. Please pause for a few minutes before trying again.';
    code = ERROR_CODES.RATE_LIMITED;
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    message = 'Security lookup service is currently unreachable. Please verify network connectivity and retry.';
    code = ERROR_CODES.SERVICE_UNREACHABLE;
  } else if (err.name === 'AbortError' || err.message?.includes('timeout')) {
    message = 'Security inspection timed out. The target server or threat intelligence service was unresponsive.';
    code = ERROR_CODES.TIMEOUT;
  } else if (err.type === 'entity.too.large') {
    message = 'Request payload exceeds maximum allowed size (50KB).';
    code = ERROR_CODES.PAYLOAD_TOO_LARGE;
  } else if (status >= 500) {
    message = 'An internal safety analysis error occurred. Please try again in a few moments.';
    code = ERROR_CODES.SERVER_ERROR;
  }

  res.status(status).json(
    formatApiError({
      code,
      message,
      requestId,
    })
  );
}

/**
 * 404 handler for unknown routes.
 */
export function notFoundHandler(req, res) {
  res.status(404).json(
    formatApiError({
      code: ERROR_CODES.NOT_FOUND,
      message: `The requested security endpoint does not exist: ${req.method} ${req.originalUrl}`,
      requestId: req?.id || 'unknown',
    })
  );
}

export default {
  createError,
  globalErrorHandler,
  notFoundHandler,
};
