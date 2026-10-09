/**
 * urlAnalyzer.js
 * ──────────────
 * Pure URL parsing, normalization, and heuristic threat evaluation.
 * Does not make external network requests (server never visits user-provided URLs).
 */

// ─── Constants ───────────────────────────────────────────────────────────────

/** Well-known URL-shortener hostnames. */
export const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly',
  'short.link', 'rb.gy', 'cutt.ly', 'is.gd', 'buff.ly',
  'tiny.cc', 'lnkd.in', 'bl.ink', 'shorturl.at', 'url.ie',
  't.ly', 'u.to', 'clck.ru', 'v.gd', 'x.co', 's.id',
]);

/** Suspicious TLDs frequently abused in phishing and malicious campaigns. */
export const SUSPICIOUS_TLDS = new Set([
  'xyz', 'top', 'club', 'online', 'site', 'info', 'biz', 'tk',
  'ml', 'ga', 'cf', 'gq', 'pw', 'cc', 'icu', 'work', 'link',
  'live', 'space', 'click', 'buzz', 'vip', 'kim', 'loan',
  'win', 'download', 'gdn', 'review', 'trade', 'fit', 'rest',
]);

/** Brand / institution keywords frequently targeted by spoofing. */
export const BRAND_KEYWORDS = [
  'paypal', 'paytm', 'google', 'googie', 'g00gle', 'amazon', 'amaz0n',
  'apple', 'microsoft', 'facebook', 'instagram', 'netflix',
  'bankof', 'sbi', 'hdfc', 'icici', 'axis', 'chase', 'wellsfargo',
  'sapthagiri', 'metamask', 'binance', 'coinbase',
];

/** Legitimate official domains to avoid false-positive brand impersonation flags. */
export const OFFICIAL_BRAND_DOMAINS = {
  google: ['google.com', 'google.co.in', 'google.co.uk', 'google.org', 'google.net'],
  paypal: ['paypal.com', 'paypal.me'],
  amazon: ['amazon.com', 'amazon.in', 'amazon.co.uk', 'amazon.de'],
  apple: ['apple.com', 'icloud.com'],
  microsoft: ['microsoft.com', 'live.com', 'office.com', 'microsoftonline.com'],
  netflix: ['netflix.com'],
  facebook: ['facebook.com', 'fb.com'],
  instagram: ['instagram.com'],
  paytm: ['paytm.com'],
  sbi: ['onlinesbi.sbi', 'sbi.co.in'],
  hdfc: ['hdfcbank.com'],
  icici: ['icicibank.com'],
  axis: ['axisbank.com'],
  chase: ['chase.com'],
  wellsfargo: ['wellsfargo.com'],
  binance: ['binance.com'],
  coinbase: ['coinbase.com'],
};

/** Urgency and credential-solicitation keywords in path or query strings. */
export const URGENCY_KEYWORDS = [
  'urgent', 'blocked', 'verify', 'verification', 'winner', 'refund',
  'kyc', 'password', 'otp', 'pin', 'suspended', 'alert', 'warning',
  'confirm', 'validate', 'activate', 'unlock', 'claim', 'prize',
  'reward', 'free', 'limited', 'immediate', 'action-required',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Attempts to parse a URL safely. Prepend https:// if no protocol is given.
 */
export function safeParseUrl(input) {
  if (typeof input !== 'string') return { parsed: null, wasGuessed: false };
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 3) return { parsed: null, wasGuessed: false };

  // Try as-is first
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
 * Returns true if the hostname is an IPv4 or IPv6 address.
 */
export function isIpAddress(hostname) {
  if (typeof hostname !== 'string') return false;
  // IPv4: four 1-3 digit blocks 0-255
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(hostname)) return true;

  // IPv6: bracketed or standard hex with colons
  const clean = hostname.replace(/^\[|\]$/g, '');
  if (/^[0-9a-fA-F:]+$/.test(clean) && clean.includes(':')) {
    return true;
  }
  return false;
}

/**
 * Extracts the registrable root domain (eTLD+1).
 */
export function extractRootDomain(hostname) {
  if (typeof hostname !== 'string') return '';
  const parts = hostname.toLowerCase().split('.');
  if (parts.length <= 2) return hostname;

  // Multi-part country TLD patterns (e.g. .co.uk, .co.in, .gov.in)
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

const countHyphens = (s) => (s ? (s.match(/-/g) || []).length : 0);
const countDigitGroups = (s) => (s ? (s.match(/\d+/g) || []).length : 0);

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Normalizes a URL safely without network calls.
 * Returns canonical string or null if unparseable.
 */
export function normalizeUrl(input) {
  const { parsed } = safeParseUrl(input);
  if (!parsed) return null;

  // Lowercase scheme and host
  const protocol = parsed.protocol.toLowerCase();
  const host = parsed.hostname.toLowerCase();
  const port = parsed.port && parsed.port !== '80' && parsed.port !== '443' ? `:${parsed.port}` : '';
  let pathname = parsed.pathname || '/';

  // Collapse duplicate slashes in path
  pathname = pathname.replace(/\/{2,}/g, '/');

  // Remove trailing slash if root path and not in original input
  if (pathname === '/' && !input.trim().endsWith('/')) {
    pathname = '';
  }

  const search = parsed.search || '';
  const hash = parsed.hash || '';

  return `${protocol}//${host}${port}${pathname}${search}${hash}`;
}

/**
 * Extracts lexical and structural features from a URL.
 */
export function parseUrlFeatures(input) {
  const { parsed, wasGuessed } = safeParseUrl(input);

  if (!parsed) {
    return {
      valid: false,
      raw: input,
      error: 'Input could not be parsed as a valid HTTP/HTTPS URL',
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const isIp = isIpAddress(hostname);
  const rootDomain = isIp ? hostname : extractRootDomain(hostname);
  const tld = isIp ? '' : hostname.split('.').pop();

  const subdomains = isIp
    ? []
    : hostname
        .replace(new RegExp(`\\.?${rootDomain.replace('.', '\\.')}$`), '')
        .split('.')
        .filter(Boolean);

  const pathAndQuery = (parsed.pathname + parsed.search).toLowerCase();

  const queryParams = {};
  parsed.searchParams.forEach((v, k) => {
    queryParams[k] = v;
  });

  // Brand impersonation matching
  const brandMatches = BRAND_KEYWORDS.filter((kw) => {
    // If this hostname is under official domain for this brand, ignore
    const officialRoots = OFFICIAL_BRAND_DOMAINS[kw] || [];
    if (officialRoots.includes(rootDomain)) {
      return false;
    }
    // Flag if brand appears in hostname or in urgent query path
    return hostname.includes(kw) || pathAndQuery.includes(kw);
  });

  // Urgency keywords in path or query
  const urgencyMatches = URGENCY_KEYWORDS.filter((kw) => pathAndQuery.includes(kw));

  return {
    valid: true,
    raw: input,
    normalized: normalizeUrl(input) || parsed.href,
    schemeGuessed: wasGuessed,

    // Protocol
    protocol: parsed.protocol,
    isHttps: parsed.protocol === 'https:',
    isHttp: parsed.protocol === 'http:',

    // Host
    hostname,
    rootDomain,
    tld,
    subdomains,
    subdomain_count: subdomains.length,
    isIpAddress: isIp,
    isShortener: URL_SHORTENERS.has(hostname),
    isSuspiciousTld: SUSPICIOUS_TLDS.has(tld),

    // Structural anomalies
    hyphenCount: countHyphens(hostname),
    digitGroupCount: countDigitGroups(hostname),
    hostnameLength: hostname.length,
    path: parsed.pathname,
    hasQueryParams: parsed.search.length > 0,
    queryParams,
    fragment: parsed.hash || null,

    // Threat triggers
    brandMatches,
    urgencyMatches,
  };
}

/**
 * Runs 11 deterministic heuristic checks against the URL.
 * Produces a risk score 0–100, risk level (safe, suspicious, high_risk),
 * and individual findings with severity ratings.
 */
export function runHeuristicChecks(input) {
  const features = parseUrlFeatures(input);
  const findings = [];
  let score = 0;

  if (!features.valid) {
    return {
      score: 0,
      riskLevel: 'safe',
      findings: [
        {
          label: 'Unparseable Target',
          severity: 'info',
          detail: 'Input is not a standard web URL format; heuristics cannot be evaluated.',
        },
      ],
      features,
      limitations: 'Heuristics evaluate structural URL patterns only.',
    };
  }

  // Check 1: Missing HTTPS (Unencrypted HTTP)
  if (features.isHttp) {
    score += 20;
    findings.push({
      label: 'Uses HTTP (Unencrypted)',
      severity: 'medium',
      detail: 'Communication over plain HTTP is unencrypted. Legitimate portals require HTTPS.',
    });
  }

  // Check 2: IP-Address Hostname
  if (features.isIpAddress) {
    score += 35;
    findings.push({
      label: 'IP-Address Hostname',
      severity: 'high',
      detail: `Host is a raw numerical IP address (${features.hostname}). Legitimate organizations use registered domain names.`,
    });
  }

  // Check 3: Known URL Shortener
  if (features.isShortener) {
    score += 25;
    findings.push({
      label: 'URL Shortener Detected',
      severity: 'medium',
      detail: `"${features.hostname}" is a URL shortener service that obscures the ultimate destination domain.`,
    });
  }

  // Check 4: Suspicious TLD
  if (features.isSuspiciousTld) {
    score += 20;
    findings.push({
      label: `Suspicious TLD (.${features.tld})`,
      severity: 'medium',
      detail: `The .${features.tld} extension has high statistical association with disposable phishing registrations.`,
    });
  }

  // Check 5: Excessive Subdomain Depth
  if (features.subdomain_count >= 4) {
    score += 25;
    findings.push({
      label: 'Excessive Subdomain Nesting',
      severity: 'high',
      detail: `${features.subdomain_count} subdomain levels detected. Phishers frequently stack subdomains to bury the actual root domain.`,
    });
  } else if (features.subdomain_count === 3) {
    score += 12;
    findings.push({
      label: 'Multiple Subdomain Levels',
      severity: 'medium',
      detail: `${features.subdomain_count} subdomain levels detected; inspect the root domain carefully (${features.rootDomain}).`,
    });
  }

  // Check 6: Hyphen Overuse
  if (features.hyphenCount >= 4) {
    score += 20;
    findings.push({
      label: 'Excessive Hyphens in Hostname',
      severity: 'high',
      detail: `${features.hyphenCount} hyphens found in domain. Heavily hyphenated domains often attempt brand imitation.`,
    });
  } else if (features.hyphenCount >= 2) {
    score += 10;
    findings.push({
      label: 'Multiple Hyphens in Hostname',
      severity: 'low',
      detail: `${features.hyphenCount} hyphens detected in hostname.`,
    });
  }

  // Check 7: Numeric Character Clustering
  if (features.digitGroupCount >= 3) {
    score += 15;
    findings.push({
      label: 'Multiple Numeric Groups in Domain',
      severity: 'medium',
      detail: `${features.digitGroupCount} numeric groups detected in domain name, consistent with automated domain generation.`,
    });
  }

  // Check 8: Brand Impersonation Keywords
  if (features.brandMatches.length > 0) {
    const pts = Math.min(features.brandMatches.length * 20, 40);
    score += pts;
    findings.push({
      label: 'Brand Impersonation Triggers',
      severity: features.brandMatches.length >= 2 ? 'high' : 'medium',
      detail: `Domain or path contains trusted brand references outside official domains: ${features.brandMatches.join(', ')}.`,
    });
  }

  // Check 9: Urgency / Credential Traps in Path or Query
  if (features.urgencyMatches.length > 0) {
    const pts = Math.min(features.urgencyMatches.length * 10, 25);
    score += pts;
    findings.push({
      label: 'Urgent / Action Social Engineering Keywords',
      severity: features.urgencyMatches.length >= 2 ? 'high' : 'medium',
      detail: `Path or query contains high-urgency keywords: ${features.urgencyMatches.join(', ')}.`,
    });
  }

  // Check 10: Unusually Long Hostname
  if (features.hostnameLength > 50) {
    score += 10;
    findings.push({
      label: 'Unusually Long Hostname',
      severity: 'low',
      detail: `Hostname length is ${features.hostnameLength} characters. Legitimate consumer domains are typically shorter.`,
    });
  }

  // Check 11: Missing Recognisable TLD
  if (!features.isIpAddress && (!features.tld || features.tld.length < 2)) {
    score += 15;
    findings.push({
      label: 'Unrecognised Domain Format',
      severity: 'medium',
      detail: 'The hostname does not end with a recognized top-level domain.',
    });
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Map to risk levels
  let riskLevel = 'safe';
  if (score >= 60) {
    riskLevel = 'high_risk';
  } else if (score >= 30) {
    riskLevel = 'suspicious';
  }

  if (findings.length === 0) {
    findings.push({
      label: 'No Suspicious Structural Markers',
      severity: 'none',
      detail: 'URL format and protocol follow standard practices. Always verify site ownership before providing credentials.',
    });
  }

  return {
    score,
    riskLevel,
    findings,
    features,
    limitations: 'Heuristic analysis evaluates syntax, brand proximity, and protocol. It cannot guarantee a URL is harmless if the site was compromised recently.',
  };
}

export default {
  URL_SHORTENERS,
  SUSPICIOUS_TLDS,
  BRAND_KEYWORDS,
  OFFICIAL_BRAND_DOMAINS,
  URGENCY_KEYWORDS,
  safeParseUrl,
  isIpAddress,
  extractRootDomain,
  normalizeUrl,
  parseUrlFeatures,
  runHeuristicChecks,
};
