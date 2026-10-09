import prisma from '../utils/prismaClient.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * Retrieves paginated threat check history records ordered newest-first.
 */
export async function getHistoryRecords({ page = 1, limit = 20, type = null } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const where = {};
  if (type === 'url' || type === 'message') {
    where.inputType = type;
  }

  const [total, checks] = await Promise.all([
    prisma.threatCheck.count({ where }),
    prisma.threatCheck.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { safetyRecommendations: true },
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
 */
export async function getHistoryRecordById(id) {
  if (!id) {
    throw createError('Record ID is required.', 400, 'INVALID_ID');
  }

  const check = await prisma.threatCheck.findUnique({
    where: { id },
    include: { safetyRecommendations: true },
  });

  if (!check) {
    throw createError('Security analysis record not found.', 404, 'RECORD_NOT_FOUND');
  }

  return check;
}

/**
 * Deletes an analysis record and cascades associated recommendations.
 */
export async function deleteHistoryRecord(id) {
  if (!id) {
    throw createError('Record ID is required.', 400, 'INVALID_ID');
  }

  const existing = await prisma.threatCheck.findUnique({
    where: { id },
  });

  if (!existing) {
    throw createError('Record not found or already deleted.', 404, 'RECORD_NOT_FOUND');
  }

  await prisma.threatCheck.delete({
    where: { id },
  });

  return {
    deletedId: id,
    message: 'Analysis record and recommendations deleted successfully.',
  };
}

/**
 * Updates or toggles completion status for a specific safety step recommendation.
 */
export async function updateRecommendationStatus(id, recId, completed = true) {
  if (!recId) {
    throw createError('Recommendation ID is required.', 400, 'INVALID_REC_ID');
  }

  const isCompleted = typeof completed === 'boolean' ? completed : true;

  const rec = await prisma.safetyRecommendation.findUnique({
    where: { id: recId },
  });

  if (!rec) {
    throw createError('Recommendation not found.', 404, 'REC_NOT_FOUND');
  }

  const updated = await prisma.safetyRecommendation.update({
    where: { id: recId },
    data: { completed: isCompleted },
  });

  return updated;
}

export default {
  getHistoryRecords,
  getHistoryRecordById,
  deleteHistoryRecord,
  updateRecommendationStatus,
};
