import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../../src/utils/prismaClient.js';
import {
  getHistoryRecords,
  getHistoryRecordById,
  deleteHistoryRecord,
  updateRecommendationStatus,
} from '../../src/services/historyService.js';

describe('Database Operations & Service Boundaries', () => {
  let createdTestRecord = null;

  beforeAll(async () => {
    await prisma.$connect();

    // Create a known test record with nested safety recommendations
    createdTestRecord = await prisma.threatCheck.create({
      data: {
        inputType: 'message',
        userInput: 'TEST_DATABASE_SUITE_PAYLOAD: Urgent password expiration alert',
        riskLevel: 'high_risk',
        threatType: 'phishing',
        confidence: 0.95,
        summary: 'Test record created specifically to verify database cascades and operations.',
        recommendedAction: 'Verify through official IT desk.',
        safetyRecommendations: {
          create: [
            { action: 'Cascade Verification Step 1', completed: false },
            { action: 'Cascade Verification Step 2', completed: false },
          ],
        },
      },
      include: {
        safetyRecommendations: true,
      },
    });
  });

  afterAll(async () => {
    if (createdTestRecord?.id) {
      await prisma.threatCheck.deleteMany({
        where: { id: createdTestRecord.id },
      });
    }
    await prisma.$disconnect();
  });

  describe('Pagination & Boundary Clamping', () => {
    it('clamps negative or zero page inputs to 1 safely', async () => {
      const result = await getHistoryRecords({ page: -5, limit: 10 });
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(Array.isArray(result.records)).toBe(true);
    });

    it('clamps excessive limit values to max 100', async () => {
      const result = await getHistoryRecords({ page: 1, limit: 999 });
      expect(result.pagination.limit).toBe(100);
    });

    it('clamps negative limit values to minimum 1', async () => {
      const result = await getHistoryRecords({ page: 1, limit: -50 });
      expect(result.pagination.limit).toBe(1);
    });
  });

  describe('Filtering Operations', () => {
    it('filters records by inputType = url', async () => {
      const result = await getHistoryRecords({ page: 1, limit: 10, type: 'url' });
      for (const rec of result.records) {
        expect(rec.inputType).toBe('url');
      }
    });

    it('filters records by inputType = message', async () => {
      const result = await getHistoryRecords({ page: 1, limit: 10, type: 'message' });
      for (const rec of result.records) {
        expect(rec.inputType).toBe('message');
      }
    });

    it('filters records by riskLevel = high_risk', async () => {
      const result = await getHistoryRecords({ page: 1, limit: 10, type: 'high_risk' });
      for (const rec of result.records) {
        expect(rec.riskLevel).toBe('high_risk');
      }
    });
  });

  describe('getHistoryRecordById()', () => {
    it('retrieves record with hydrated child recommendations', async () => {
      const record = await getHistoryRecordById(createdTestRecord.id);
      expect(record.id).toBe(createdTestRecord.id);
      expect(record.safetyRecommendations).toHaveLength(2);
      expect(record.safetyRecommendations[0].action).toContain('Cascade Verification');
    });

    it('throws 400 when ID is omitted or null', async () => {
      await expect(getHistoryRecordById(null)).rejects.toThrow('Record ID is required.');
    });

    it('throws 404 RECORD_NOT_FOUND when ID does not exist', async () => {
      await expect(getHistoryRecordById('non-existent-guid-99999')).rejects.toThrow(
        'Security analysis record not found.'
      );
    });
  });

  describe('updateRecommendationStatus()', () => {
    it('updates recommendation step completed status', async () => {
      const rec = createdTestRecord.safetyRecommendations[0];
      const updated = await updateRecommendationStatus(createdTestRecord.id, rec.id, true);
      expect(updated.id).toBe(rec.id);
      expect(updated.completed).toBe(true);

      // Revert back
      const reverted = await updateRecommendationStatus(createdTestRecord.id, rec.id, false);
      expect(reverted.completed).toBe(false);
    });

    it('throws 400 when recommendation ID is omitted', async () => {
      await expect(updateRecommendationStatus(createdTestRecord.id, null, true)).rejects.toThrow(
        'Recommendation ID is required.'
      );
    });

    it('throws 404 when recommendation does not exist', async () => {
      await expect(
        updateRecommendationStatus(createdTestRecord.id, 'non-existent-rec-id', true)
      ).rejects.toThrow('Recommendation not found.');
    });
  });

  describe('Cascade Deletion Integrity', () => {
    it('deletes parent threat check and cascades to all child safety recommendations', async () => {
      // Create a dedicated record specifically to delete and inspect cascade
      const transientRecord = await prisma.threatCheck.create({
        data: {
          inputType: 'url',
          userInput: 'https://test-cascade-deletion.xyz',
          riskLevel: 'high_risk',
          threatType: 'malware',
          safetyRecommendations: {
            create: [
              { action: 'Step to be cascaded 1', completed: false },
              { action: 'Step to be cascaded 2', completed: false },
            ],
          },
        },
        include: { safetyRecommendations: true },
      });

      const transientId = transientRecord.id;
      const childIds = transientRecord.safetyRecommendations.map((r) => r.id);
      expect(childIds).toHaveLength(2);

      // Perform deletion
      const deleteResult = await deleteHistoryRecord(transientId);
      expect(deleteResult.deletedId).toBe(transientId);

      // Verify parent no longer exists
      const parentCheck = await prisma.threatCheck.findUnique({ where: { id: transientId } });
      expect(parentCheck).toBeNull();

      // Verify child rows were automatically cascaded
      const orphanChildren = await prisma.safetyRecommendation.findMany({
        where: { id: { in: childIds } },
      });
      expect(orphanChildren).toHaveLength(0);
    });

    it('throws 404 when attempting to delete already deleted or non-existent record', async () => {
      await expect(deleteHistoryRecord('already-deleted-id-xyz')).rejects.toThrow(
        'Record not found or already deleted.'
      );
    });
  });
});
