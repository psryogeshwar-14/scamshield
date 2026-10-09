import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkSafeBrowsing } from '../../src/services/safeBrowsing.js';

describe('safeBrowsing — Unit Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it('returns unavailable when API key is unconfigured', async () => {
    vi.stubEnv('SAFEBROWSING_API_KEY', '');
    const result = await checkSafeBrowsing('https://example.com');
    expect(result.status).toBe('unavailable');
    expect(result.threats).toEqual([]);
    expect(result.error).toContain('not configured');
  });

  it('returns unavailable for empty or invalid URL input', async () => {
    const result = await checkSafeBrowsing('');
    expect(result.status).toBe('unavailable');
    expect(result.error).toBeDefined();
  });

  it('handles simulated clean threat response', async () => {
    // Temporarily mock configuration check
    vi.stubEnv('SAFEBROWSING_API_KEY', 'TEST_SAFEBROWSING_KEY_12345');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ matches: [] }),
    });

    const result = await checkSafeBrowsing('https://google.com');
    expect(result.status).toBe('clean');
    expect(result.threats).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('handles simulated active threat match response', async () => {
    vi.stubEnv('SAFEBROWSING_API_KEY', 'TEST_SAFEBROWSING_KEY_12345');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        matches: [
          {
            threatType: 'SOCIAL_ENGINEERING',
            platformType: 'ANY_PLATFORM',
            threat: { url: 'http://malicious-test.xyz' },
          },
        ],
      }),
    });

    const result = await checkSafeBrowsing('http://malicious-test.xyz');
    expect(result.status).toBe('threat');
    expect(result.threats).toHaveLength(1);
    expect(result.threats[0].threatType).toBe('SOCIAL_ENGINEERING');
  });

  it('handles simulated rate limiting (HTTP 429)', async () => {
    vi.stubEnv('SAFEBROWSING_API_KEY', 'TEST_SAFEBROWSING_KEY_12345');

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    });

    const result = await checkSafeBrowsing('https://example.com');
    expect(result.status).toBe('unavailable');
    expect(result.error).toContain('rate limit');
  });

  it('handles fetch timeout or network failure without throwing', async () => {
    vi.stubEnv('SAFEBROWSING_API_KEY', 'TEST_SAFEBROWSING_KEY_12345');

    global.fetch = vi.fn().mockRejectedValue(new Error('Network connection dropped'));

    const result = await checkSafeBrowsing('https://example.com');
    expect(result.status).toBe('unavailable');
    expect(result.error).toContain('Network error');
  });

  it('handles HTTP 403 API key permission errors gracefully', async () => {
    vi.stubEnv('SAFEBROWSING_API_KEY', 'TEST_SAFEBROWSING_KEY_12345');

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'The caller does not have permission for Safe Browsing API',
    });

    const result = await checkSafeBrowsing('https://example.com');
    expect(result.status).toBe('unavailable');
    expect(result.error).toContain('403');
    expect(result.details).toContain('permission');
  });

  it('handles arbitrary 5xx upstream server errors gracefully', async () => {
    vi.stubEnv('SAFEBROWSING_API_KEY', 'TEST_SAFEBROWSING_KEY_12345');

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });

    const result = await checkSafeBrowsing('https://example.com');
    expect(result.status).toBe('unavailable');
    expect(result.error).toContain('503');
  });

  it('handles AbortError timeout signals without throwing', async () => {
    vi.stubEnv('SAFEBROWSING_API_KEY', 'TEST_SAFEBROWSING_KEY_12345');

    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    global.fetch = vi.fn().mockRejectedValue(abortError);

    const result = await checkSafeBrowsing('https://example.com');
    expect(result.status).toBe('unavailable');
    expect(result.error).toContain('timed out');
  });

  it('handles malformed / non-JSON responses from Safe Browsing endpoint', async () => {
    vi.stubEnv('SAFEBROWSING_API_KEY', 'TEST_SAFEBROWSING_KEY_12345');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON at position 0');
      },
    });

    const result = await checkSafeBrowsing('https://example.com');
    expect(result.status).toBe('unavailable');
    expect(result.error).toContain('JSON');
  });
});
