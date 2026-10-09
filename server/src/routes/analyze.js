import { Router } from 'express';
import { analyzeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  urlAnalysisValidation,
  messageAnalysisValidation,
  genericAnalysisValidation,
} from '../validators/analyzeValidators.js';
import {
  analyzeUrl,
  analyzeMessage,
  analyzeUnified,
} from '../controllers/analyzeController.js';

const router = Router();

// Apply rate limiting to all analysis endpoints
router.use(analyzeLimiter);

// POST /api/analyze/url
router.post('/url', urlAnalysisValidation, validateRequest, analyzeUrl);

// POST /api/analyze/message
router.post('/message', messageAnalysisValidation, validateRequest, analyzeMessage);

// POST /api/analyze (Unified polymorphic endpoint)
router.post('/', genericAnalysisValidation, validateRequest, analyzeUnified);

export default router;
