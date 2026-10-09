import prisma from '../utils/prismaClient.js';
import logger from '../utils/logger.js';

/**
 * ThreatCheck Repository
 * ──────────────────────
 * Dedicated data access layer for threat check records.
 * Encapsulates all Prisma database operations away from business services.
 */

export async function createThreatCheckRecord({
  inputType,
  userInput,
  riskLevel,
  threatType = 'unknown',
  confidence = null,
  summary = null,
  evidenceJson = null,
  recommendedAction = null,
  safetyStepsJson = null,
  safeBrowsingResult = null,
  safetySteps = [],
}) {
  try {
    return await prisma.threatCheck.create({
      data: {
        inputType,
        userInput,
        riskLevel,
        threatType,
        confidence: typeof confidence === 'number' ? confidence : null,
        summary,
        evidenceJson: typeof evidenceJson === 'string' ? evidenceJson : JSON.stringify(evidenceJson || []),
        recommendedAction,
        safetyStepsJson: typeof safetyStepsJson === 'string' ? safetyStepsJson : JSON.stringify(safetyStepsJson || []),
        safeBrowsingResult: typeof safeBrowsingResult === 'string' ? safeBrowsingResult : safeBrowsingResult ? JSON.stringify(safeBrowsingResult) : null,
        safetyRecommendations: {
          create: (safetySteps || []).map((action) => ({
            action,
            completed: false,
          })),
        },
      },
      include: {
        safetyRecommendations: true,
      },
    });
  } catch (err) {
    logger.warn(`ThreatCheckRepository: Could not persist threat check to SQLite: ${err.message}`);
    return null;
  }
}

export async function findThreatCheckById(id, { includeRecommendations = true } = {}) {
  if (!id) return null;
  return await prisma.threatCheck.findUnique({
    where: { id },
    ...(includeRecommendations ? { include: { safetyRecommendations: true } } : {}),
  });
}

export async function countThreatChecks(where = {}) {
  return await prisma.threatCheck.count({ where });
}

export async function findThreatChecksWithPagination({
  where = {},
  skip = 0,
  take = 20,
  includeRecommendations = false,
  orderBy = { createdAt: 'desc' },
} = {}) {
  return await prisma.threatCheck.findMany({
    where,
    orderBy,
    skip,
    take,
    ...(includeRecommendations ? { include: { safetyRecommendations: true } } : {}),
  });
}

export async function deleteThreatCheckById(id) {
  if (!id) return null;
  return await prisma.threatCheck.delete({
    where: { id },
  });
}

export default {
  createThreatCheckRecord,
  findThreatCheckById,
  countThreatChecks,
  findThreatChecksWithPagination,
  deleteThreatCheckById,
};
