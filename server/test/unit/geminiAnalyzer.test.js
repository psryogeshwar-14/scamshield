import { describe, it, expect } from 'vitest';
import {
  sanitizeResult,
  fallbackAnalyzeMessage,
  fallbackAnalyzeUrl,
} from '../../src/services/geminiAnalyzer.js';
import { runHeuristicChecks } from '../../src/services/urlAnalyzer.js';
import { FIXTURES } from '../fixtures/threatFixtures.js';

describe('geminiAnalyzer — Unit & Fallback Tests', () => {
  describe('fallbackAnalyzeMessage()', () => {
    it('detects high-risk OTP fraud attempts', () => {
      const result = fallbackAnalyzeMessage(FIXTURES.highRiskOtpScamMessage);
      expect(result.riskLevel).toBe('high_risk');
      expect(result.threatType).toBe('otp_scam');
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.evidence.some((e) => e.toLowerCase().includes('otp'))).toBe(true);
      expect(result.safetySteps.length).toBeGreaterThan(0);
    });

    it('detects advance-fee recruitment / job scams', () => {
      const result = fallbackAnalyzeMessage(FIXTURES.highRiskJobScamMessage);
      expect(result.riskLevel).toBe('high_risk');
      expect(result.threatType).toBe('fake_job');
      expect(result.evidence.some((e) => e.toLowerCase().includes('task') || e.toLowerCase().includes('telegram'))).toBe(true);
    });

    it('detects lottery / payment / UPI fraud messages', () => {
      const result = fallbackAnalyzeMessage(FIXTURES.highRiskPaymentScamMessage);
      expect(result.riskLevel).toBe('high_risk');
      expect(result.threatType).toBe('payment_scam');
    });

    it('detects malware sideloading messages', () => {
      const result = fallbackAnalyzeMessage(FIXTURES.highRiskMalwareMessage);
      expect(result.riskLevel).toBe('high_risk');
      expect(result.threatType).toBe('malware');
    });

    it('classifies benign everyday greetings and student messages as safe', () => {
      const result = fallbackAnalyzeMessage(FIXTURES.safeMessage);
      expect(result.riskLevel).toBe('safe');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('classifies ambiguous or low-context messages as suspicious', () => {
      const result = fallbackAnalyzeMessage('Click this order status update now: bit.ly/test');
      expect(result.riskLevel).toBe('suspicious');
      expect(result.needsHumanConfirmation).toBe(true);
    });
  });

  describe('fallbackAnalyzeUrl()', () => {
    it('produces high-risk verdict when heuristics score is high', () => {
      const heuristics = runHeuristicChecks(FIXTURES.highRiskPhishingUrl);
      const safeBrowsing = { status: 'unavailable', threats: [] };
      const result = fallbackAnalyzeUrl(FIXTURES.highRiskPhishingUrl, heuristics, safeBrowsing);

      expect(result.riskLevel).toBe('high_risk');
      expect(result.threatType).toBe('impersonation');
      expect(result.evidence.length).toBeGreaterThan(0);
    });

    it('produces safe verdict for legitimate standard domains', () => {
      const heuristics = runHeuristicChecks(FIXTURES.safeUrl);
      const safeBrowsing = { status: 'clean', threats: [] };
      const result = fallbackAnalyzeUrl(FIXTURES.safeUrl, heuristics, safeBrowsing);

      expect(result.riskLevel).toBe('safe');
      expect(result.threatType).toBe('unknown');
    });
  });

  describe('sanitizeResult() — Schema Validation & Repair', () => {
    it('sanitizes valid structured output', () => {
      const raw = {
        inputType: 'message',
        riskLevel: 'high_risk',
        threatType: 'otp_scam',
        confidence: 0.95,
        summary: 'Detected credential solicitation attempt.',
        evidence: ['Urgent phrasing', 'Demands OTP'],
        recommendedAction: 'Do not share codes.',
        safetySteps: ['Delete message', 'Call bank'],
        needsHumanConfirmation: false,
      };

      const sanitized = sanitizeResult(raw, 'message');
      expect(sanitized.riskLevel).toBe('high_risk');
      expect(sanitized.threatType).toBe('otp_scam');
      expect(sanitized.confidence).toBe(0.95);
    });

    it('repairs invalid riskLevel and missing fields gracefully', () => {
      const malformed = {
        riskLevel: 'super_dangerous_danger', // invalid enum
        threatType: 'invalid_type',
        confidence: 'not-a-number',
        summary: '',
        evidence: null,
      };

      const sanitized = sanitizeResult(malformed, 'message');
      expect(sanitized.riskLevel).toBe('suspicious'); // repaired default
      expect(sanitized.threatType).toBe('unknown'); // repaired default
      expect(typeof sanitized.confidence).toBe('number');
      expect(sanitized.summary.length).toBeGreaterThan(0);
      expect(Array.isArray(sanitized.evidence)).toBe(true);
      expect(Array.isArray(sanitized.safetySteps)).toBe(true);
    });
  });
});
