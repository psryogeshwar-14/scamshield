import { createError } from '../middleware/errorHandler.js';
import {
  findThreatChecksWithPagination,
  countThreatChecks,
  findThreatCheckById,
  deleteThreatCheckById,
} from '../repositories/threatCheckRepository.js';
import {
  findRecommendationById,
  updateRecommendationCompletion,
} from '../repositories/recommendationRepository.js';

/**
 * historyService.js
 * ──────────────────
 * Service managing persistence queries, record retrieval, and recommendation state.
 * Encapsulates business logic and delegates database queries to repositories.
 */

/**
 * Retrieves paginated threat check history records ordered newest-first.
 *
 * @param {Object} options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {string|null} [options.type=null]
 * @param {boolean} [options.includeRecommendations=false]
 * @returns {Promise<{records: Array<Object>, pagination: Object}>}
 */
export async function getHistoryRecords({
  page = 1,
  limit = 20,
  type = null,
  includeRecommendations = false,
} = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const where = {};
  if (type === 'url' || type === 'message') {
    where.inputType = type;
  } else if (type === 'high_risk') {
    where.riskLevel = 'high_risk';
  }

  const [total, checks] = await Promise.all([
    countThreatChecks(where),
    findThreatChecksWithPagination({
      where,
      includeRecommendations,
      skip,
      take: safeLimit,
    }),
  ]);

  const totalPages = Math.ceil(total / safeLimit) || 1;

  return {
    records: checks,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      hasMore: safePage < totalPages,
    },
  };
}

/**
 * Retrieves a single analysis record by ID with relations.
 *
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getHistoryRecordById(id) {
  if (!id) {
    throw createError('Record ID is required.', 400, 'INVALID_ID');
  }

  const check = await findThreatCheckById(id);

  if (!check) {
    throw createError('Security analysis record not found.', 404, 'RECORD_NOT_FOUND');
  }

  return check;
}

/**
 * Deletes an analysis record and cascades associated recommendations.
 *
 * @param {string} id
 * @returns {Promise<{deletedId: string, message: string}>}
 */
export async function deleteHistoryRecord(id) {
  if (!id) {
    throw createError('Record ID is required.', 400, 'INVALID_ID');
  }

  const existing = await findThreatCheckById(id);

  if (!existing) {
    throw createError('Record not found or already deleted.', 404, 'RECORD_NOT_FOUND');
  }

  await deleteThreatCheckById(id);

  return {
    deletedId: id,
    message: 'Analysis record and recommendations deleted successfully.',
  };
}

/**
 * Updates or toggles completion status for a specific safety step recommendation.
 *
 * @param {string} id - Parent ThreatCheck ID
 * @param {string} recId - SafetyRecommendation ID
 * @param {boolean} [completed=true]
 * @returns {Promise<Object>}
 */
export async function updateRecommendationStatus(id, recId, completed = true) {
  if (!recId) {
    throw createError('Recommendation ID is required.', 400, 'INVALID_REC_ID');
  }

  const isCompleted = typeof completed === 'boolean' ? completed : true;

  const rec = await findRecommendationById(recId);

  if (!rec) {
    throw createError('Recommendation not found.', 404, 'REC_NOT_FOUND');
  }

  return updateRecommendationCompletion(recId, isCompleted);
}

export default {
  getHistoryRecords,
  getHistoryRecordById,
  deleteHistoryRecord,
  updateRecommendationStatus,
};
