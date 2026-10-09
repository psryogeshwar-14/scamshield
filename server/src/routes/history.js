import { Router } from 'express';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  historyQueryValidation,
  historyIdValidation,
  updateRecommendationValidation,
} from '../validators/historyValidators.js';
import {
  getHistory,
  getHistoryById,
  deleteHistory,
  updateRecommendation,
} from '../controllers/historyController.js';

const router = Router();

// Apply general rate limiter
router.use(generalLimiter);

// GET /api/history (Paginated records with filtering)
router.get('/', historyQueryValidation, validateRequest, getHistory);

// GET /api/history/:id (Single record by ID)
router.get('/:id', historyIdValidation, validateRequest, getHistoryById);

// DELETE /api/history/:id (Delete record by ID)
router.delete('/:id', historyIdValidation, validateRequest, deleteHistory);

// PATCH /api/history/:id/recommendations/:recId (Toggle step completion)
router.patch('/:id/recommendations/:recId', updateRecommendationValidation, validateRequest, updateRecommendation);

export default router;
