import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  analyzeMessageWithGemini,
  analyzeUrlWithGemini,
} from '../../src/services/geminiAnalyzer.js';
import { runHeuristicChecks } from '../../src/services/urlAnalyzer.js';

// Setup mock for @google/genai
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      ARRAY: 'ARRAY',
      BOOLEAN: 'BOOLEAN',
    },
    GoogleGenAI: class MockGoogleGenAI {
      constructor() {
        this.models = {
          generateContent: mockGenerateContent,
        };
      }
    },
  };
});

describe('geminiAnalyzer — Mocked AI API Integration & Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('GEMINI_API_KEY', 'TEST_GEMINI_KEY_ABC123');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('analyzeMessageWithGemini()', () => {
    it('returns sanitized result when Gemini returns valid structured JSON', async () => {
      const validAiPayload = {
        inputType: 'message',
        riskLevel: 'high_risk',
        threatType: 'otp_scam',
        confidence: 0.98,
        summary: 'Deceptive SMS soliciting banking OTP under threat of suspension.',
        evidence: ['Urgent 24-hour threat', 'Requests one-time password'],
        recommendedAction: 'Do not share OTP. Contact bank through official app.',
        safetySteps: ['Block sender', 'Change account password'],
        needsHumanConfirmation: false,
      };

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(validAiPayload),
      });

      const result = await analyzeMessageWithGemini('Your bank account will be blocked. Share OTP.');

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(result.riskLevel).toBe('high_risk');
      expect(result.threatType).toBe('otp_scam');
      expect(result.confidence).toBe(0.98);
      expect(result.summary).toContain('banking OTP');
      expect(result.evidence).toHaveLength(2);
      expect(result.safetySteps).toHaveLength(2);
    });

    it('falls back to deterministic engine when Gemini returns invalid JSON string', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: '<<Malformed AI Output Not JSON>>',
      });

      const result = await analyzeMessageWithGemini('URGENT: Verify your account immediately or lose access.');

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      // Fallback engine kicks in seamlessly
      expect(result.riskLevel).toBeDefined();
      expect(result._fallbackNote).toBeDefined();
      expect(result._fallbackNote).toContain('ScamShield deterministic engine');
    });

    it('falls back to deterministic engine when Gemini throws API rate limit error (429)', async () => {
      const rateLimitError = new Error('Resource exhausted: quota exceeded (HTTP 429)');
      rateLimitError.status = 429;
      mockGenerateContent.mockRejectedValueOnce(rateLimitError);

      const result = await analyzeMessageWithGemini('Hello mom, my phone is broken, text my new number.');

      expect(result.riskLevel).toBeDefined();
      expect(result._fallbackNote).toContain('quota exceeded');
    });

    it('falls back to deterministic engine when Gemini throws network abort / timeout', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Fetch failed: connection aborted'));

      const result = await analyzeMessageWithGemini('Send 500 dollars to claim your lottery jackpot prize!');

      expect(result.riskLevel).toBe('high_risk');
      expect(result.threatType).toBe('payment_scam');
      expect(result._fallbackNote).toContain('connection aborted');
    });
  });

  describe('analyzeUrlWithGemini()', () => {
    it('returns sanitized result when Gemini evaluates URL successfully', async () => {
      const url = 'https://paypal-security-verification.serveo.net/login';
      const heuristics = runHeuristicChecks(url);
      const safeBrowsing = { status: 'unavailable', threats: [] };

      const validAiPayload = {
        inputType: 'url',
        riskLevel: 'high_risk',
        threatType: 'impersonation',
        confidence: 0.95,
        summary: 'Tunneling host masquerading as official PayPal authentication page.',
        evidence: ['Serveo tunnel detected', 'PayPal brand keyword in subdomain'],
        recommendedAction: 'Close browser immediately and do not enter login credentials.',
        safetySteps: ['Check official URL', 'Clear browser cache'],
        needsHumanConfirmation: false,
      };

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(validAiPayload),
      });

      const result = await analyzeUrlWithGemini(url, heuristics, safeBrowsing);

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(result.riskLevel).toBe('high_risk');
      expect(result.threatType).toBe('impersonation');
      expect(result.confidence).toBe(0.95);
      expect(result.summary).toContain('Tunneling host');
    });

    it('falls back to deterministic heuristics when Gemini model throws exception', async () => {
      const url = 'https://apple-id-verify.phish-login.xyz';
      const heuristics = runHeuristicChecks(url);
      const safeBrowsing = { status: 'unavailable', threats: [] };

      mockGenerateContent.mockRejectedValueOnce(new Error('AI model service temporarily unavailable'));

      const result = await analyzeUrlWithGemini(url, heuristics, safeBrowsing);

      expect(result.riskLevel).toBe(heuristics.riskLevel);
      expect(result._fallbackNote).toBeDefined();
      expect(result._fallbackNote).toContain('AI model service temporarily unavailable');
    });
  });
});
