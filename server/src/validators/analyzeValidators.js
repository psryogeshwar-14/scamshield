import { body } from 'express-validator';

/**
 * Validation rules for POST /api/analyze/url
 */
export const urlAnalysisValidation = [
  body('url')
    .trim()
    .notEmpty()
    .withMessage('Please enter a web address (URL) to analyze.')
    .isString()
    .withMessage('URL input must be text.')
    .isLength({ min: 3, max: 2048 })
    .withMessage('URL must be between 3 and 2048 characters long.')
    .custom((val) => {
      // Prevent control characters or null bytes
      const hasControlChar = Array.from(val).some((c) => {
        const code = c.charCodeAt(0);
        return (code >= 0 && code < 32) || code === 127;
      });
      if (hasControlChar) {
        throw new Error('URL contains invalid control characters.');
      }
      return true;
    }),
];

/**
 * Validation rules for POST /api/analyze/message
 */
export const messageAnalysisValidation = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Please provide message content to analyze.')
    .isString()
    .withMessage('Message input must be text.')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters long.')
    .custom((val) => {
      // Prevent null bytes
      if (/\0/.test(val)) {
        throw new Error('Message contains invalid null byte characters.');
      }
      return true;
    }),
];

/**
 * Validation rules for unified POST /api/analyze
 */
export const genericAnalysisValidation = [
  body('inputType')
    .isIn(['url', 'message'])
    .withMessage('inputType must be "url" or "message".'),
  body('userInput')
    .trim()
    .notEmpty()
    .withMessage('Please provide text to analyze.')
    .isString()
    .withMessage('Input must be text.')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Input must be between 1 and 5000 characters long.')
    .custom((val) => {
      if (/\0/.test(val)) {
        throw new Error('Input contains invalid characters.');
      }
      return true;
    }),
];

export default {
  urlAnalysisValidation,
  messageAnalysisValidation,
  genericAnalysisValidation,
};
