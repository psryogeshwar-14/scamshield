import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';
import app from '../src/app.js';
import { sanitizeResult, fallbackAnalyzeMessage } from '../src/services/geminiAnalyzer.js';
import { checkSafeBrowsing } from '../src/services/safeBrowsing.js';

describe('Adversarial Security & Penetration Tests', () => {
  describe('Oversized Input & Buffer Overflow Protections', () => {
    it('rejects oversized JSON request body exceeding 50KB with HTTP 413', async () => {
      const hugePayload = { url: 'https://example.com/?param=' + 'A'.repeat(60 * 1024) };
      const res = await request(app)
        .post('/api/analyze/url')
        .set('Content-Type', 'application/json')
        .send(hugePayload);

      expect(res.status).toBe(413);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
      expect(res.body.error.message).toContain('50KB');
    });

    it('rejects oversized URL exceeding 2048 characters with HTTP 400', async () => {
      const longUrl = 'https://example.com/' + 'x'.repeat(2100);
      const res = await request(app)
        .post('/api/analyze/url')
        .set('Content-Type', 'application/json')
        .send({ url: longUrl });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects oversized Message exceeding 5000 characters with HTTP 400', async () => {
      const longMessage = 'Urgent notice: ' + 'A'.repeat(5100);
      const res = await request(app)
        .post('/api/analyze/message')
        .set('Content-Type', 'application/json')
        .send({ message: longMessage });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Malformed URLs & Protocol Injection', () => {
    it('rejects URL with null byte characters with HTTP 400', async () => {
      const nullByteUrl = 'https://example.com/\0evil';
      const res = await request(app)
        .post('/api/analyze/url')
        .set('Content-Type', 'application/json')
        .send({ url: nullByteUrl });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects URL with ASCII control characters with HTTP 400', async () => {
      const controlCharUrl = 'https://example.com/\x07\x08malicious';
      const res = await request(app)
        .post('/api/analyze/url')
        .set('Content-Type', 'application/json')
        .send({ url: controlCharUrl });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('safely handles non-standard / unparseable target strings without server crash', async () => {
      const res = await request(app)
        .post('/api/analyze/url')
        .set('Content-Type', 'application/json')
        .send({ url: 'totally-not-a-valid-scheme://???&&&' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.riskLevel).toBeDefined();
    });
  });

  describe('HTML, Script Payloads & XSS Sanitization', () => {
    it('safely digests script tag injection in message text without execution', async () => {
      const xssPayload = '<script>alert(document.cookie)</script><img src=x onerror=prompt(1)>';
      const res = await request(app)
        .post('/api/analyze/message')
        .set('Content-Type', 'application/json')
        .send({ message: xssPayload });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.raw).toBe(xssPayload);
      expect(typeof res.body.data.riskLevel).toBe('string');
    });

    it('safely digests HTML injection in URL query parameters without SSRF or DOM execution', async () => {
      const xssUrl = 'https://example.com/login?redirect="><script>alert(1)</script>';
      const res = await request(app)
        .post('/api/analyze/url')
        .set('Content-Type', 'application/json')
        .send({ url: xssUrl });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.raw).toBe(xssUrl);
    });
  });

  describe('CORS Origin Controls', () => {
    it('blocks cross-origin requests from unapproved origin with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://malicious-untrusted-site.com');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CORS_FORBIDDEN');
      expect(res.body.error.message).toContain('CORS');
    });

    it('permits cross-origin requests from configured client origin', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });
  });

  describe('External API Resiliency & Fallback Under Failure', () => {
    it('engages deterministic fallback classification when Gemini API is unconfigured', async () => {
      const fallbackResult = fallbackAnalyzeMessage('Your bank account is suspended today. Share your OTP immediately to stop deactivation.');
      expect(fallbackResult.riskLevel).toBe('high_risk');
      expect(fallbackResult.threatType).toBe('otp_scam');
      expect(fallbackResult.confidence).toBeGreaterThanOrEqual(0.85);
      expect(Array.isArray(fallbackResult.safetySteps)).toBe(true);
    });

    it('sanitizes adversarial, incomplete, or malformed Gemini JSON model output', async () => {
      const poisonedOutput = {
        riskLevel: 'CATASTROPHIC_EXPLOSION', // Invalid enum
        confidence: NaN,                    // Non-number
        summary: 999999,                    // Not a string
        evidence: null,                     // Not an array
        safetySteps: 'just run away',       // String instead of array
        threatType: 'unknown_alien_threat', // Invalid threat enum
        needsHumanConfirmation: 'yes please',
      };

      const clean = sanitizeResult(poisonedOutput, 'message');
      expect(['safe', 'suspicious', 'high_risk']).toContain(clean.riskLevel);
      expect(clean.confidence).toBe(0.85);
      expect(typeof clean.summary).toBe('string');
      expect(Array.isArray(clean.evidence)).toBe(true);
      expect(Array.isArray(clean.safetySteps)).toBe(true);
      expect(clean.threatType).toBe('unknown');
      expect(clean.needsHumanConfirmation).toBe(true);
    });

    it('safely handles unconfigured or slow Google Safe Browsing without reporting false safe', async () => {
      const sbResult = await checkSafeBrowsing('https://example.com');
      expect(sbResult.status).toBe('unavailable');
      expect(sbResult.threats).toEqual([]);
      expect(sbResult.details).toBeDefined();
    });
  });

  describe('Rate Limiter Throttling Enforcement', () => {
    it('returns HTTP 429 and rate limit headers when thresholds are exceeded', async () => {
      const testApp = express();
      const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 5,
        statusCode: 429,
        standardHeaders: true,
        message: { success: false, error: { message: 'Too many requests.', code: 'RATE_LIMITED' } },
      });
      testApp.use('/test-throttle', testLimiter, (_req, res) => res.json({ ok: true }));

      let got429 = false;
      let limitHeader = null;
      for (let i = 0; i < 7; i++) {
        const res = await request(testApp).get('/test-throttle');
        if (res.status === 429) {
          got429 = true;
          limitHeader = res.headers['ratelimit-limit'];
        }
      }

      expect(got429).toBe(true);
      expect(limitHeader).toBe('5');
    });
  });

  describe('Error Masking & Stack Trace Concealment', () => {
    it('returns standard error schema without leaking stack trace for 404 routes', async () => {
      const res = await request(app).get('/api/secret-admin-console-endpoint');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.error.requestId).toBeDefined();
      expect(res.body.error.stack).toBeUndefined();
    });

    it('masks database operational errors and prevents SQLite schema disclosure', async () => {
      const fakeDbError = new Error('SQLITE_ERROR: table ThreatCheck has no column secret_data');
      fakeDbError.name = 'PrismaClientKnownRequestError';
      fakeDbError.code = 'P2002';

      const mockReq = { method: 'GET', path: '/api/test', id: 'req-db-test' };
      const mockRes = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
      };

      const { globalErrorHandler } = await import('../src/middleware/errorHandler.js');
      globalErrorHandler(fakeDbError, mockReq, mockRes, () => {});

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.body.error.code).toBe('DATABASE_ERROR');
      expect(mockRes.body.error.message).not.toContain('SQLITE_ERROR');
      expect(mockRes.body.error.message).toContain('database operation');
      expect(mockRes.body.error.stack).toBeUndefined();
    });
  });
});
