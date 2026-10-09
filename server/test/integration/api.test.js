import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/utils/prismaClient.js';
import { FIXTURES } from '../fixtures/threatFixtures.js';

describe('API Integration Tests', () => {
  let createdRecordId = null;

  beforeAll(async () => {
    // Ensure database client is ready
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up test records created during run
    if (createdRecordId) {
      await prisma.threatCheck.deleteMany({
        where: { id: createdRecordId },
      });
    }
    await prisma.$disconnect();
  });

  describe('GET /api/health', () => {
    it('returns service health status and liveness metrics', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.service).toBe('ScamShield API');
      expect(res.headers['x-request-id']).toBeDefined();
    });
  });

  describe('POST /api/analyze/url', () => {
    it('analyzes a suspicious URL and returns structured security report', async () => {
      const res = await request(app)
        .post('/api/analyze/url')
        .send({ url: FIXTURES.highRiskPhishingUrl })
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inputType).toBe('url');
      expect(res.body.data.riskLevel).toBe('high_risk');
      expect(res.body.data.threatType).toBeDefined();
      expect(res.body.data.whyThisResult).toBeDefined();
      expect(res.body.data.whyThisResult.deterministicChecks).toBeDefined();
      expect(res.body.data.whyThisResult.externalReputation).toBeDefined();
      expect(res.body.data.whyThisResult.aiInterpretation).toBeDefined();
      expect(res.body.data.whyThisResult.limitations.length).toBeGreaterThan(0);
      expect(res.body.data.safetySteps.length).toBeGreaterThan(0);

      if (res.body.data.id) {
        createdRecordId = res.body.data.id;
      }
    });

    it('rejects empty URL with 400 Bad Request and validation errors', async () => {
      const res = await request(app)
        .post('/api/analyze/url')
        .send({ url: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toBeDefined();
    });

    it('rejects oversized URL input with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/analyze/url')
        .send({ url: FIXTURES.oversizedUrl });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects URL with control characters', async () => {
      const res = await request(app)
        .post('/api/analyze/url')
        .send({ url: FIXTURES.controlCharUrl });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/analyze/message', () => {
    it('analyzes an OTP scam message and returns high_risk classification', async () => {
      const res = await request(app)
        .post('/api/analyze/message')
        .send({ message: FIXTURES.highRiskOtpScamMessage });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inputType).toBe('message');
      expect(res.body.data.riskLevel).toBe('high_risk');
      expect(res.body.data.threatType).toBe('otp_scam');
      expect(res.body.data.recommendedAction).toBeDefined();
      expect(res.body.data.whyThisResult).toBeDefined();
    });

    it('classifies benign conversational message as safe', async () => {
      const res = await request(app)
        .post('/api/analyze/message')
        .send({ message: FIXTURES.safeMessage });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.riskLevel).toBe('safe');
    });

    it('rejects empty message with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/analyze/message')
        .send({ message: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects oversized message input (> 5000 chars)', async () => {
      const res = await request(app)
        .post('/api/analyze/message')
        .send({ message: FIXTURES.oversizedMessage });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/analyze (Unified Endpoint)', () => {
    it('routes URL inputs properly through polymorphic endpoint', async () => {
      const res = await request(app)
        .post('/api/analyze')
        .send({ inputType: 'url', userInput: FIXTURES.safeUrl });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inputType).toBe('url');
    });

    it('routes Message inputs properly through polymorphic endpoint', async () => {
      const res = await request(app)
        .post('/api/analyze')
        .send({ inputType: 'message', userInput: FIXTURES.safeMessage });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inputType).toBe('message');
    });

    it('rejects invalid inputType with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/analyze')
        .send({ inputType: 'executable', userInput: 'test' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/history & record manipulation', () => {
    it('returns paginated history records list', async () => {
      const res = await request(app)
        .get('/api/history?page=1&limit=5');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
    });

    it('filters history by target type', async () => {
      const res = await request(app)
        .get('/api/history?type=url&limit=5');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const item of res.body.data) {
        expect(item.inputType).toBe('url');
      }
    });

    it('rejects invalid pagination parameters with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/history?page=-1');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('retrieves single record by ID', async () => {
      if (!createdRecordId) return;

      const res = await request(app).get(`/api/history/${createdRecordId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdRecordId);
    });

    it('returns 404 for non-existent record ID', async () => {
      const res = await request(app).get('/api/history/non-existent-id-12345');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RECORD_NOT_FOUND');
    });

    it('updates recommendation step completion status via PATCH', async () => {
      if (!createdRecordId) return;

      const recordRes = await request(app).get(`/api/history/${createdRecordId}`);
      const rec = recordRes.body.data?.safetyRecommendations?.[0];
      if (!rec) return;

      const patchRes = await request(app)
        .patch(`/api/history/${createdRecordId}/recommendations/${rec.id}`)
        .send({ completed: true });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.success).toBe(true);
      expect(patchRes.body.data.completed).toBe(true);
    });

    it('deletes analysis record successfully via DELETE', async () => {
      if (!createdRecordId) return;

      const delRes = await request(app).delete(`/api/history/${createdRecordId}`);
      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
      expect(delRes.body.deletedId).toBe(createdRecordId);

      // Verify it no longer exists
      const verifyRes = await request(app).get(`/api/history/${createdRecordId}`);
      expect(verifyRes.status).toBe(404);
      createdRecordId = null;
    });
  });

  describe('Security & Edge Cases', () => {
    it('returns 404 with correlation ID for non-existent endpoints', async () => {
      const res = await request(app).get('/api/unsupported-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.error.requestId).toBeDefined();
    });

    it('includes Helmet security headers in HTTP responses', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
  });
});
