/**
 * Standardized API Error Response Formatter
 * ─────────────────────────────────────────
 * Conforms to Requirement 5:
 * {
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "User-safe message",
 *     "requestId": "id"
 *   }
 * }
 * Also retains `success: false` for backward compatibility with existing tests and clients.
 */

export function formatApiError({ code = 'INTERNAL_ERROR', message = 'An unexpected error occurred.', requestId = 'unknown', details }) {
  const errorObj = {
    code,
    message,
    requestId,
  };

  if (details !== undefined) {
    errorObj.details = details;
  }

  return {
    success: false,
    error: errorObj,
  };
}

export default formatApiError;
