/**
 * safeBrowsingMapper.js
 * ─────────────────────
 * Pure data transformation functions for Google Safe Browsing API v4.
 * Decouples payload generation and response parsing from network transport.
 */

/**
 * Builds the standard lookup payload for Google Safe Browsing v4 threatMatches:find.
 *
 * @param {string} url - Target URL to query
 * @returns {Object} JSON payload for Safe Browsing API
 */
export function buildSafeBrowsingPayload(url) {
  return {
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
}

/**
 * Maps a successful Google Safe Browsing v4 JSON response to standard SafeBrowsingResult.
 *
 * @param {Object} json - JSON parsed response from Google Safe Browsing API
 * @param {string} originalUrl - The URL that was queried
 * @param {number} checkedAt - Timestamp in milliseconds
 * @returns {Object}
 */
export function mapSafeBrowsingResponse(json, originalUrl, checkedAt = Date.now()) {
  if (!json || !json.matches || json.matches.length === 0) {
    return {
      status: 'clean',
      threats: [],
      error: null,
      details: 'No matches found in Google Safe Browsing threat databases. (Note: Newly created malicious domains may not yet be indexed).',
      checkedAt,
    };
  }

  const threats = json.matches.map((m) => ({
    threatType: m.threatType,
    platformType: m.platformType,
    url: m.threat?.url || originalUrl,
  }));

  return {
    status: 'threat',
    threats,
    error: null,
    details: `Active security warning flagged by Google Safe Browsing: ${threats.map((t) => t.threatType).join(', ')}`,
    checkedAt,
  };
}

/**
 * Maps HTTP status codes or API errors into structured SafeBrowsingResult.
 *
 * @param {number} statusCode
 * @param {string} [bodyText]
 * @param {number} [checkedAt]
 * @returns {Object}
 */
export function mapSafeBrowsingHttpError(statusCode, bodyText = '', checkedAt = Date.now()) {
  if (statusCode === 429) {
    return {
      status: 'unavailable',
      threats: [],
      error: 'Safe Browsing API rate limit reached.',
      details: 'Google reputation feed temporarily throttled. Local heuristic engine remains active.',
      checkedAt,
    };
  }

  if (statusCode === 400 || statusCode === 403) {
    return {
      status: 'unavailable',
      threats: [],
      error: `Safe Browsing API access error (${statusCode})`,
      details: bodyText.slice(0, 150) || 'Check API key permissions for Google Safe Browsing API v4.',
      checkedAt,
    };
  }

  return {
    status: 'unavailable',
    threats: [],
    error: `Safe Browsing service returned HTTP ${statusCode}`,
    details: 'External threat lookup service experienced an error.',
    checkedAt,
  };
}

/**
 * Maps network or timeout exceptions into structured SafeBrowsingResult.
 *
 * @param {Error} error
 * @param {number} timeoutMs
 * @param {number} [checkedAt]
 * @returns {Object}
 */
export function mapSafeBrowsingException(error, timeoutMs = 4000, checkedAt = Date.now()) {
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return {
      status: 'unavailable',
      threats: [],
      error: `Safe Browsing query timed out after ${timeoutMs / 1000}s`,
      details: 'Threat intelligence service was slow to respond. Evaluation proceeded with heuristic engine.',
      checkedAt,
    };
  }

  return {
    status: 'unavailable',
    threats: [],
    error: `Network error contacting Safe Browsing: ${error.message}`,
    details: 'Unable to reach Google Safe Browsing servers.',
    checkedAt,
  };
}

export default {
  buildSafeBrowsingPayload,
  mapSafeBrowsingResponse,
  mapSafeBrowsingHttpError,
  mapSafeBrowsingException,
};
