import { describe, it, expect } from 'vitest';
import {
  safeParseUrl,
  isIpAddress,
  extractRootDomain,
  normalizeUrl,
} from '../../src/domain/urlNormalization.js';
import {
  extractUrlFeatures,
  evaluateUrlHeuristics,
} from '../../src/domain/urlHeuristics.js';
import {
  detectPaymentFraudSignals,
  detectOtpScamSignals,
  detectJobFraudSignals,
  detectMalwareSignals,
  detectConversationalSignals,
  evaluateMessageSignals,
} from '../../src/domain/messageSignals.js';
import {
  reconcileRiskLevel,
  resolveThreatType,
  calculateConfidence,
} from '../../src/domain/riskClassification.js';
import {
  buildSafeBrowsingPayload,
  mapSafeBrowsingResponse,
  mapSafeBrowsingHttpError,
  mapSafeBrowsingException,
} from '../../src/domain/safeBrowsingMapper.js';
import {
  validateAndSanitizeGeminiResponse,
  buildMessageAnalysisPrompt,
  buildUrlAnalysisPrompt,
} from '../../src/domain/geminiValidation.js';
import {
  assembleWhyThisResult,
  generateFallbackRecommendations,
  assembleUrlAnalysisResult,
  assembleMessageAnalysisResult,
} from '../../src/domain/resultAssembler.js';

describe('Domain Engine: URL Normalization', () => {
  it('safely parses valid HTTP/HTTPS URLs', () => {
    const { parsed, wasGuessed } = safeParseUrl('https://example.com/login?param=1');
    expect(parsed).not.toBeNull();
    expect(parsed.hostname).toBe('example.com');
    expect(wasGuessed).toBe(false);
  });

  it('prepends https scheme if missing and sets wasGuessed to true', () => {
    const { parsed, wasGuessed } = safeParseUrl('sub.example.com/test');
    expect(parsed).not.toBeNull();
    expect(parsed.protocol).toBe('https:');
    expect(parsed.hostname).toBe('sub.example.com');
    expect(wasGuessed).toBe(true);
  });

  it('returns parsed: null for empty or non-string input', () => {
    expect(safeParseUrl('').parsed).toBeNull();
    expect(safeParseUrl(null).parsed).toBeNull();
    expect(safeParseUrl(undefined).parsed).toBeNull();
    expect(safeParseUrl(12345).parsed).toBeNull();
  });

  it('correctly identifies IPv4 addresses', () => {
    expect(isIpAddress('192.168.1.1')).toBe(true);
    expect(isIpAddress('10.0.0.1')).toBe(true);
    expect(isIpAddress('example.com')).toBe(false);
  });

  it('extracts root domain from subdomains including multi-part TLDs', () => {
    expect(extractRootDomain('bank.login.portal.example.com')).toBe('example.com');
    expect(extractRootDomain('portal.sub.example.co.uk')).toBe('example.co.uk');
  });

  it('normalizes URL casing and standard ports', () => {
    const norm = normalizeUrl('HTTPS://EXAMPLE.COM:443/Path/');
    expect(norm).toBe('https://example.com/Path/');
  });
});

describe('Domain Engine: URL Heuristics', () => {
  it('flags IP address URLs with high risk score', () => {
    const result = evaluateUrlHeuristics('http://192.168.1.100/admin');
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.findings.some((f) => f.label.includes('IP-Address'))).toBe(true);
  });

  it('flags unencrypted HTTP protocol', () => {
    const result = evaluateUrlHeuristics('http://ordinary-site.org');
    expect(result.findings.some((f) => f.label.includes('Uses HTTP'))).toBe(true);
  });

  it('detects brand impersonation keywords on unauthorized hostnames', () => {
    const result = evaluateUrlHeuristics('https://paypal-security-update.xyz/verify');
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.riskLevel).toBe('high_risk');
    expect(result.features.brandMatches).toContain('paypal');
  });

  it('recognizes official brand domains and does not flag false impersonation', () => {
    const result = evaluateUrlHeuristics('https://www.paypal.com/signin');
    expect(result.features.brandMatches).toHaveLength(0);
    expect(result.riskLevel).toBe('safe');
  });
});

describe('Domain Engine: Message Signals', () => {
  it('detects UPI and QR code payment fraud signals', () => {
    const signals = detectPaymentFraudSignals('Scan this QR code to claim your prize refund of Rs 5000');
    expect(signals.matched).toBe(true);
  });

  it('detects OTP extortion with urgency triggers', () => {
    const signals = detectOtpScamSignals('Your SBI account is suspended! Share your OTP immediately to stop deactivation.');
    expect(signals.matched).toBe(true);
  });

  it('detects recruitment and freelance task scams', () => {
    const signals = detectJobFraudSignals('Work from home part time job offer earn daily income join telegram task fee');
    expect(signals.matched).toBe(true);
  });

  it('detects malware sideloading executable vectors', () => {
    const signals = detectMalwareSignals('Download and install file security_update.apk on your phone');
    expect(signals.matched).toBe(true);
  });

  it('correctly classifies benign daily conversational messages as safe', () => {
    const signals = detectConversationalSignals('Hi! See you at the library tomorrow for the hackathon project assignment.');
    expect(signals.matched).toBe(true);
  });

  it('evaluates overall message signals end-to-end', () => {
    const evalResult = evaluateMessageSignals('URGENT: Your account is blocked! Send your OTP to 9876543210');
    expect(evalResult.riskLevel).toBe('high_risk');
    expect(evalResult.threatType).toBe('otp_scam');
    expect(evalResult.evidence.length).toBeGreaterThan(0);
  });
});

describe('Domain Engine: Risk Classification & Reconciliation', () => {
  it('enforces Invariant 1: Confirmed Safe Browsing threat is strictly high_risk', () => {
    const risk = reconcileRiskLevel({
      heuristicsRisk: 'safe',
      safeBrowsingStatus: 'threat',
      geminiRisk: 'safe',
    });
    expect(risk).toBe('high_risk');
  });

  it('enforces Invariant 2: Deterministic heuristic high_risk cannot be overridden by AI', () => {
    const risk = reconcileRiskLevel({
      heuristicsRisk: 'high_risk',
      safeBrowsingStatus: 'clean',
      geminiRisk: 'safe',
    });
    expect(risk).toBe('high_risk');
  });

  it('enforces Invariant 3: Heuristic suspicious cannot be downgraded to safe by AI', () => {
    const risk = reconcileRiskLevel({
      heuristicsRisk: 'suspicious',
      safeBrowsingStatus: 'clean',
      geminiRisk: 'safe',
    });
    expect(risk).toBe('suspicious');
  });

  it('resolves impersonation threat type when brand matches are present', () => {
    const type = resolveThreatType({
      aiThreatType: 'unknown',
      brandMatches: ['paypal'],
    });
    expect(type).toBe('impersonation');
  });

  it('bounds confidence metrics safely between 0.10 and 1.00', () => {
    expect(calculateConfidence({ aiConfidence: 1.5 })).toBe(1.0);
    expect(calculateConfidence({ aiConfidence: -0.5 })).toBe(0.1);
    expect(calculateConfidence({ aiConfidence: 0.887 })).toBe(0.89);
  });
});

describe('Domain Engine: Safe Browsing Mapper', () => {
  it('builds standard v4 lookup payload', () => {
    const payload = buildSafeBrowsingPayload('https://malware-site.test');
    expect(payload.client.clientId).toBe('scamshield');
    expect(payload.threatInfo.threatEntries[0].url).toBe('https://malware-site.test');
  });

  it('maps empty matches to clean status', () => {
    const mapped = mapSafeBrowsingResponse({ matches: [] }, 'https://clean-site.test');
    expect(mapped.status).toBe('clean');
    expect(mapped.threats).toHaveLength(0);
  });

  it('maps matches to threat status with threat list details', () => {
    const mapped = mapSafeBrowsingResponse({
      matches: [{ threatType: 'MALWARE', platformType: 'ANY_PLATFORM' }],
    }, 'https://infected.test');
    expect(mapped.status).toBe('threat');
    expect(mapped.threats[0].threatType).toBe('MALWARE');
  });

  it('maps HTTP 429 to unavailable with rate limit detail', () => {
    const mapped = mapSafeBrowsingHttpError(429);
    expect(mapped.status).toBe('unavailable');
    expect(mapped.error).toContain('rate limit');
  });

  it('maps timeout AbortError to unavailable without throwing', () => {
    const abortErr = new Error('Aborted');
    abortErr.name = 'AbortError';
    const mapped = mapSafeBrowsingException(abortErr, 4000);
    expect(mapped.status).toBe('unavailable');
    expect(mapped.error).toContain('timed out');
  });
});

describe('Domain Engine: Gemini Validation & Prompts', () => {
  it('sanitizes missing fields and sets safe defaults', () => {
    const sanitized = validateAndSanitizeGeminiResponse({});
    expect(sanitized.riskLevel).toBe('suspicious');
    expect(sanitized.threatType).toBe('unknown');
    expect(sanitized.confidence).toBe(0.85);
    expect(sanitized.safetySteps.length).toBeGreaterThan(0);
  });

  it('builds clear student-centric prompts for URL and messages', () => {
    const promptMsg = buildMessageAnalysisPrompt('Test message');
    expect(promptMsg).toContain('Test message');
    expect(promptMsg).toContain('responseSchema');

    const promptUrl = buildUrlAnalysisPrompt('https://test.com', { score: 50, riskLevel: 'suspicious', findings: [] }, { status: 'clean' });
    expect(promptUrl).toContain('https://test.com');
  });
});

describe('Domain Engine: Result Assembler', () => {
  it('assembles explainable whyThisResult for URL analysis', () => {
    const why = assembleWhyThisResult({
      inputType: 'url',
      heuristics: { score: 65, riskLevel: 'high_risk', findings: [{ label: 'IP', detail: 'test' }] },
      safeBrowsing: { status: 'clean', threats: [], checkedAt: Date.now() },
      aiAnalysis: { summary: 'summary', evidence: ['e1'], threatType: 'phishing', confidence: 0.9 },
    });

    expect(why.deterministicChecks.score).toBe(65);
    expect(why.externalReputation.status).toBe('clean');
    expect(why.aiInterpretation.threatType).toBe('phishing');
    expect(why.limitations.length).toBeGreaterThan(0);
  });

  it('generates fallback recommendation IDs when database persistence is unavailable', () => {
    const steps = ['Step 1', 'Step 2'];
    const recs = generateFallbackRecommendations(steps);
    expect(recs).toHaveLength(2);
    expect(recs[0].id).toBe('fallback-0');
    expect(recs[0].action).toBe('Step 1');
    expect(recs[0].completed).toBe(false);
  });

  it('assembles canonical URL analysis result payload', () => {
    const result = assembleUrlAnalysisResult({
      id: 'test-id',
      rawUrl: 'https://test.com',
      normalizedUrl: 'https://test.com',
      riskLevel: 'safe',
      threatType: 'unknown',
      confidence: 0.95,
      summary: 'Safe site',
      evidence: ['No threat found'],
      recommendedAction: 'Proceed safely',
      safetySteps: ['Check URL'],
      heuristics: { score: 0, riskLevel: 'safe', findings: [] },
      safeBrowsing: { status: 'clean', threats: [], error: null, checkedAt: Date.now(), details: 'OK' },
      aiAnalysis: { summary: 'Safe site' },
      whyThisResult: {},
    });

    expect(result.id).toBe('test-id');
    expect(result.inputType).toBe('url');
    expect(result.riskLevel).toBe('safe');
    expect(result.safetyRecommendations).toHaveLength(1);
  });

  it('assembles canonical Message analysis result payload', () => {
    const result = assembleMessageAnalysisResult({
      id: 'msg-id',
      rawMessage: 'Hello friend',
      riskLevel: 'safe',
      threatType: 'unknown',
      confidence: 0.95,
      summary: 'Conversational',
      evidence: ['No triggers'],
      recommendedAction: 'Standard safety',
      safetySteps: ['Be alert'],
      aiAnalysis: {},
      whyThisResult: {},
    });

    expect(result.id).toBe('msg-id');
    expect(result.inputType).toBe('message');
    expect(result.riskLevel).toBe('safe');
  });
});
