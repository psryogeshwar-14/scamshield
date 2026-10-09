import { validationResult } from 'express-validator';

/**
 * Middleware that checks express-validator results.
 * If validation fails, responds with 400 Bad Request, a consistent error schema,
 * and correlation ID.
 */
export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId: req?.id || 'unknown',
        details: errors.array().map((e) => ({
          field: e.path || (e.param ? e.param : 'unknown'),
          message: e.msg,
          value: e.value !== undefined ? String(e.value).slice(0, 50) : undefined,
        })),
      },
    });
  }
  next();
}

export default validateRequest;
