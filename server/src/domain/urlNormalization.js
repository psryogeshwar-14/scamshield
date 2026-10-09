/**
 * Pure URL Normalization and Decomposition Functions
 * ──────────────────────────────────────────────────
 * Safe, zero-network utility for parsing, sanitizing, and normalizing web URLs.
 */

/**
 * Attempts to parse a URL safely. Prepends https:// if no scheme is provided.
 *
 * @param {string} input - Raw URL string
 * @returns {{ parsed: URL|null, wasGuessed: boolean }}
 */
export function safeParseUrl(input) {
  if (typeof input !== 'string') return { parsed: null, wasGuessed: false };
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 3) return { parsed: null, wasGuessed: false };

  // Try parsing as-is first
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return { parsed, wasGuessed: false };
    }
  } catch {}

  // If no scheme, prepend https://
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    try {
      const parsed = new URL('https://' + trimmed);
      return { parsed, wasGuessed: true };
    } catch {}
  }

  return { parsed: null, wasGuessed: false };
}

/**
 * Checks whether a hostname is an IPv4 or IPv6 address.
 *
 * @param {string} hostname
 * @returns {boolean}
 */
export function isIpAddress(hostname) {
  if (typeof hostname !== 'string') return false;
  // IPv4: four 1-3 digit octets (0-255)
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(hostname)) return true;

  // IPv6: hex with colons (bracketed or standard)
  const clean = hostname.replace(/^\[|\]$/g, '');
  if (/^[0-9a-fA-F:]+$/.test(clean) && clean.includes(':')) {
    return true;
  }
  return false;
}

/**
 * Extracts the registrable root domain (eTLD+1).
 *
 * @param {string} hostname
 * @returns {string}
 */
export function extractRootDomain(hostname) {
  if (typeof hostname !== 'string') return '';
  const parts = hostname.toLowerCase().split('.');
  if (parts.length <= 2) return hostname;

  // Common multi-part country TLD patterns (e.g. .co.uk, .co.in, .gov.in)
  const multiPartTLDs = new Set([
    'co.uk', 'co.in', 'gov.in', 'ac.in', 'edu.in', 'com.au',
    'co.nz', 'co.za', 'com.br', 'co.jp', 'org.uk',
  ]);

  const lastTwo = parts.slice(-2).join('.');
  if (multiPartTLDs.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

/**
 * Normalizes a URL into canonical representation without network calls.
 *
 * @param {string} input - Raw URL string
 * @returns {string|null} Canonical normalized URL string or null if unparseable
 */
export function normalizeUrl(input) {
  const { parsed } = safeParseUrl(input);
  if (!parsed) return null;

  const protocol = parsed.protocol.toLowerCase();
  const host = parsed.hostname.toLowerCase();
  const port = parsed.port && parsed.port !== '80' && parsed.port !== '443' ? `:${parsed.port}` : '';
  let pathname = parsed.pathname || '/';

  // Collapse consecutive slashes in path
  pathname = pathname.replace(/\/{2,}/g, '/');

  // Strip trailing slash if root path and not in original input
  if (pathname === '/' && !input.trim().endsWith('/')) {
    pathname = '';
  }

  const search = parsed.search || '';
  const hash = parsed.hash || '';

  return `${protocol}//${host}${port}${pathname}${search}${hash}`;
}

export default {
  safeParseUrl,
  isIpAddress,
  extractRootDomain,
  normalizeUrl,
};
