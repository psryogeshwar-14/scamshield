import prisma from '../utils/prismaClient.js';

/**
 * Recommendation Repository
 * ─────────────────────────
 * Dedicated data access layer for SafetyRecommendation items.
 */

export async function findRecommendationById(id) {
  if (!id) return null;
  return await prisma.safetyRecommendation.findUnique({
    where: { id },
  });
}

export async function updateRecommendationCompletion(id, completed = true) {
  if (!id) return null;
  return await prisma.safetyRecommendation.update({
    where: { id },
    data: { completed: Boolean(completed) },
  });
}

export async function findRecommendationsByThreatCheckId(threatCheckId) {
  if (!threatCheckId) return [];
  return await prisma.safetyRecommendation.findMany({
    where: { threatCheckId },
    orderBy: { createdAt: 'asc' },
  });
}

export default {
  findRecommendationById,
  updateRecommendationCompletion,
  findRecommendationsByThreatCheckId,
};
