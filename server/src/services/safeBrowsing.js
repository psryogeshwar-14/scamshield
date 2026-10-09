import { isSafeBrowsingConfigured, getSafeBrowsingApiKey, TIMEOUTS } from '../config/index.js';

/**
 * safeBrowsing.js
 * ───────────────
 * Integration with Google Safe Browsing Lookup API v4.
 * Guarantees a structured result object without throwing exceptions.
 */

const SB_ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

/**
 * @typedef {Object} SafeBrowsingResult
 * @property {'clean'|'threat'|'unavailable'} status
 * @property {Array<{threatType: string, platformType: string, url: string}>} threats
 * @property {string|null} error
 * @property {number} checkedAt
 * @property {string} details
 */

/**
 * Queries Google Safe Browsing Lookup v4 for a target URL.
 *
 * @param {string} url - Target URL to verify
 * @returns {Promise<SafeBrowsingResult>}
 */
export async function checkSafeBrowsing(url) {
  const now = Date.now();

  // Guard 1: API key not configured
  if (!isSafeBrowsingConfigured()) {
    return {
      status: 'unavailable',
      threats: [],
      error: 'Google Safe Browsing API key not configured.',
      details: 'Reputation lookup unavailable. Security evaluation based on structural heuristics and AI analysis.',
      checkedAt: now,
    };
  }

  // Guard 2: Invalid URL input
  if (typeof url !== 'string' || url.trim().length === 0) {
    return {
      status: 'unavailable',
      threats: [],
      error: 'Invalid URL provided.',
      details: 'Cannot query Safe Browsing without a valid URL string.',
      checkedAt: now,
    };
  }

  const payload = {
    client: {
      clientId: 'scamshield',
      clientVersion: '1.0.0',
    },
    threatInfo: {
      threatTypes: [
        'MALWARE',
        'SOCIAL_ENGINEERING',
        'UNWANTED_SOFTWARE',
        'POTENTIALLY_HARMFUL_APPLICATION',
      ],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url }],
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.SAFE_BROWSING_MS);

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

    // Rate-limited by Google
    if (response.status === 429) {
      return {
        status: 'unavailable',
        threats: [],
        error: 'Safe Browsing API rate limit reached.',
        details: 'Google reputation feed temporarily throttled. Local heuristic engine remains active.',
        checkedAt: now,
      };
    }

    // Permission / API disabled / Quota exceeded
    if (response.status === 400 || response.status === 403) {
      const errText = await response.text().catch(() => '');
      return {
        status: 'unavailable',
        threats: [],
        error: `Safe Browsing API access error (${response.status})`,
        details: errText.slice(0, 150) || 'Check API key permissions for Google Safe Browsing API v4.',
        checkedAt: now,
      };
    }

    if (!response.ok) {
      return {
        status: 'unavailable',
        threats: [],
        error: `Safe Browsing service returned HTTP ${response.status}`,
        details: 'External threat lookup service experienced an error.',
        checkedAt: now,
      };
    }

    const json = await response.json();

    // No matches -> clean in current threat lists
    if (!json.matches || json.matches.length === 0) {
      return {
        status: 'clean',
        threats: [],
        error: null,
        details: 'No matches found in Google Safe Browsing threat databases. (Note: Newly created malicious domains may not yet be indexed).',
        checkedAt: now,
      };
    }

    const threats = json.matches.map((m) => ({
      threatType: m.threatType,
      platformType: m.platformType,
      url: m.threat?.url || url,
    }));

    return {
      status: 'threat',
      threats,
      error: null,
      details: `Active security warning flagged by Google Safe Browsing: ${threats.map((t) => t.threatType).join(', ')}`,
      checkedAt: now,
    };
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      return {
        status: 'unavailable',
        threats: [],
        error: `Safe Browsing query timed out after ${TIMEOUTS.SAFE_BROWSING_MS / 1000}s`,
        details: 'Threat intelligence service was slow to respond. Evaluation proceeded with heuristic engine.',
        checkedAt: now,
      };
    }

    return {
      status: 'unavailable',
      threats: [],
      error: `Network error contacting Safe Browsing: ${err.message}`,
      details: 'Unable to reach Google Safe Browsing servers.',
      checkedAt: now,
    };
  }
}

export default {
  checkSafeBrowsing,
};
