import { validationResult } from 'express-validator';
import { formatApiError } from '../utils/apiError.js';
import { ERROR_CODES } from '../constants/threatTypes.js';

/**
 * Middleware that checks express-validator results.
 * If validation fails, responds with 400 Bad Request, a consistent error schema,
 * and correlation ID.
 */
export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({
      field: e.path || (e.param ? e.param : 'unknown'),
      message: e.msg,
      value: e.value !== undefined ? String(e.value).slice(0, 50) : undefined,
    }));

    return res.status(400).json(
      formatApiError({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        requestId: req?.id || 'unknown',
        details,
      })
    );
  }
  next();
}

export default validateRequest;
