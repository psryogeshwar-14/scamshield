/**
 * safeBrowsing.js
 * ───────────────
 * Facade service for Google Safe Browsing Lookup API v4.
 * Delegates network transport to safeBrowsingClient and mapping to safeBrowsingMapper.
 */

import { querySafeBrowsing } from '../integrations/safeBrowsingClient.js';

/**
 * Queries Google Safe Browsing Lookup v4 for a target URL.
 *
 * @param {string} url - Target URL to verify
 * @returns {Promise<import('../domain/safeBrowsingMapper.js').SafeBrowsingResult>}
 */
export async function checkSafeBrowsing(url) {
  return querySafeBrowsing(url);
}

export default {
  checkSafeBrowsing,
};
