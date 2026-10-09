import { isSafeBrowsingConfigured, getSafeBrowsingApiKey, TIMEOUTS } from '../config/index.js';
import {
  buildSafeBrowsingPayload,
  mapSafeBrowsingResponse,
  mapSafeBrowsingHttpError,
  mapSafeBrowsingException,
} from '../domain/safeBrowsingMapper.js';

const SB_ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

/**
 * safeBrowsingClient.js
 * ─────────────────────
 * Network client for Google Safe Browsing Lookup API v4.
 * Integrates external HTTP communication with pure domain mappers.
 * Guarantees a structured result object without throwing unhandled exceptions.
 */

/**
 * Queries Google Safe Browsing Lookup v4 for a target URL.
 *
 * @param {string} url - Target URL to verify
 * @param {Object} [options]
 * @param {number} [options.timeoutMs]
 * @returns {Promise<import('../domain/safeBrowsingMapper.js').SafeBrowsingResult>}
 */
export async function querySafeBrowsing(url, { timeoutMs = TIMEOUTS.SAFE_BROWSING_MS } = {}) {
  const now = Date.now();

  // Guard 1: Configuration check
  if (!isSafeBrowsingConfigured()) {
    return {
      status: 'unavailable',
      threats: [],
      error: 'Google Safe Browsing API key not configured.',
      details: 'Reputation lookup unavailable. Security evaluation based on structural heuristics and AI analysis.',
      checkedAt: now,
    };
  }

  // Guard 2: Parameter check
  if (typeof url !== 'string' || url.trim().length === 0) {
    return {
      status: 'unavailable',
      threats: [],
      error: 'Invalid URL provided.',
      details: 'Cannot query Safe Browsing without a valid URL string.',
      checkedAt: now,
    };
  }

  const payload = buildSafeBrowsingPayload(url);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const apiKey = getSafeBrowsingApiKey();
    const response = await fetch(
      `${SB_ENDPOINT}?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ScamShield-Security-Auditor/1.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = typeof response.text === 'function'
        ? await response.text().catch(() => '')
        : '';
      return mapSafeBrowsingHttpError(response.status, errText, now);
    }

    const json = await response.json();
    return mapSafeBrowsingResponse(json, url, now);
  } catch (err) {
    clearTimeout(timeoutId);
    return mapSafeBrowsingException(err, timeoutMs, now);
  }
}

export default {
  querySafeBrowsing,
};
