import { param, query, body } from 'express-validator';

/**
 * Validation rules for GET /api/history query parameters
 */
export const historyQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('page must be a positive integer between 1 and 10000.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100.')
    .toInt(),
  query('type')
    .optional()
    .isIn(['url', 'message', 'high_risk', 'all'])
    .withMessage('type filter must be "url", "message", "high_risk", or "all".'),
];

/**
 * Validation rules for route param :id
 */
export const historyIdValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Record ID is required.')
    .isString()
    .isLength({ min: 1, max: 128 })
    .withMessage('Invalid record ID format.'),
];

/**
 * Validation rules for recommendation status updates
 */
export const updateRecommendationValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Record ID is required.')
    .isLength({ min: 1, max: 128 }),
  param('recId')
    .trim()
    .notEmpty()
    .withMessage('Recommendation ID is required.')
    .isLength({ min: 1, max: 128 }),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('completed must be a boolean (true or false).')
    .toBoolean(),
];

export default {
  historyQueryValidation,
  historyIdValidation,
  updateRecommendationValidation,
};
