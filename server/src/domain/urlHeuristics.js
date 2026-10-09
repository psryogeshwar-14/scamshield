import { safeParseUrl, isIpAddress, extractRootDomain, normalizeUrl } from './urlNormalization.js';
import { RISK_LEVELS, SCORING_THRESHOLDS, HEURISTIC_WEIGHTS } from '../constants/threatTypes.js';

/**
 * Pure URL Heuristics Detection Engine
 * ────────────────────────────────────
 * Modular evaluation of 11 structural and lexical threat patterns.
 */

export const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly',
  'short.link', 'rb.gy', 'cutt.ly', 'is.gd', 'buff.ly',
  'tiny.cc', 'lnkd.in', 'bl.ink', 'shorturl.at', 'url.ie',
  't.ly', 'u.to', 'clck.ru', 'v.gd', 'x.co', 's.id',
]);

export const SUSPICIOUS_TLDS = new Set([
  'xyz', 'top', 'club', 'online', 'site', 'info', 'biz', 'tk',
  'ml', 'ga', 'cf', 'gq', 'pw', 'cc', 'icu', 'work', 'link',
  'live', 'space', 'click', 'buzz', 'vip', 'kim', 'loan',
  'win', 'download', 'gdn', 'review', 'trade', 'fit', 'rest',
]);

export const BRAND_KEYWORDS = [
  'paypal', 'paytm', 'google', 'googie', 'g00gle', 'amazon', 'amaz0n',
  'apple', 'microsoft', 'facebook', 'instagram', 'netflix',
  'bankof', 'sbi', 'hdfc', 'icici', 'axis', 'chase', 'wellsfargo',
  'sapthagiri', 'metamask', 'binance', 'coinbase',
];

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

export const URGENCY_KEYWORDS = [
  'urgent', 'blocked', 'verify', 'verification', 'winner', 'refund',
  'kyc', 'password', 'otp', 'pin', 'suspended', 'alert', 'warning',
  'confirm', 'validate', 'activate', 'unlock', 'claim', 'prize',
  'reward', 'free', 'limited', 'immediate', 'action-required',
];

const countHyphens = (s) => (s ? (s.match(/-/g) || []).length : 0);
const countDigitGroups = (s) => (s ? (s.match(/\d+/g) || []).length : 0);

/**
 * Extracts lexical and structural attributes from a target URL.
 */
export function extractUrlFeatures(input) {
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

  const brandMatches = BRAND_KEYWORDS.filter((kw) => {
    const officialRoots = OFFICIAL_BRAND_DOMAINS[kw] || [];
    if (officialRoots.includes(rootDomain)) {
      return false;
    }
    return hostname.includes(kw) || pathAndQuery.includes(kw);
  });

  const urgencyMatches = URGENCY_KEYWORDS.filter((kw) => pathAndQuery.includes(kw));

  return {
    valid: true,
    raw: input,
    normalized: normalizeUrl(input) || parsed.href,
    schemeGuessed: wasGuessed,

    protocol: parsed.protocol,
    isHttps: parsed.protocol === 'https:',
    isHttp: parsed.protocol === 'http:',

    hostname,
    rootDomain,
    tld,
    subdomains,
    subdomain_count: subdomains.length,
    isIpAddress: isIp,
    isShortener: URL_SHORTENERS.has(hostname),
    isSuspiciousTld: SUSPICIOUS_TLDS.has(tld),

    hyphenCount: countHyphens(hostname),
    digitGroupCount: countDigitGroups(hostname),
    hostnameLength: hostname.length,
    path: parsed.pathname,
    hasQueryParams: parsed.search.length > 0,
    queryParams,
    fragment: parsed.hash || null,

    brandMatches,
    urgencyMatches,
  };
}

/**
 * Pure heuristic rules definitions.
 */
export const HEURISTIC_RULES = [
  {
    id: 'unencrypted_http',
    name: 'Unencrypted HTTP Protocol',
    test: (f) => f.isHttp,
    weight: HEURISTIC_WEIGHTS.HTTP_UNENCRYPTED,
    finding: () => ({
      label: 'Uses HTTP (Unencrypted)',
      severity: 'medium',
      detail: 'Communication over plain HTTP is unencrypted. Legitimate portals require HTTPS.',
    }),
  },
  {
    id: 'ip_hostname',
    name: 'IP Address Hostname',
    test: (f) => f.isIpAddress,
    weight: HEURISTIC_WEIGHTS.IP_ADDRESS_HOST,
    finding: (f) => ({
      label: 'IP-Address Hostname',
      severity: 'high',
      detail: `Host is a raw numerical IP address (${f.hostname}). Legitimate organizations use registered domain names.`,
    }),
  },
  {
    id: 'url_shortener',
    name: 'Known URL Shortener',
    test: (f) => f.isShortener,
    weight: HEURISTIC_WEIGHTS.URL_SHORTENER,
    finding: (f) => ({
      label: 'URL Shortener Detected',
      severity: 'medium',
      detail: `"${f.hostname}" is a URL shortener service that obscures the ultimate destination domain.`,
    }),
  },
  {
    id: 'suspicious_tld',
    name: 'Suspicious TLD Extension',
    test: (f) => f.isSuspiciousTld,
    weight: HEURISTIC_WEIGHTS.SUSPICIOUS_TLD,
    finding: (f) => ({
      label: `Suspicious TLD (.${f.tld})`,
      severity: 'medium',
      detail: `The .${f.tld} extension has high statistical association with disposable phishing registrations.`,
    }),
  },
  {
    id: 'excessive_subdomains',
    name: 'Excessive Subdomain Depth',
    test: (f) => f.subdomain_count >= 4,
    weight: HEURISTIC_WEIGHTS.EXCESSIVE_SUBDOMAINS,
    finding: (f) => ({
      label: 'Excessive Subdomain Nesting',
      severity: 'high',
      detail: `${f.subdomain_count} subdomain levels detected. Phishers frequently stack subdomains to bury the actual root domain.`,
    }),
  },
  {
    id: 'moderate_subdomains',
    name: 'Multiple Subdomain Levels',
    test: (f) => f.subdomain_count === 3,
    weight: HEURISTIC_WEIGHTS.MODERATE_SUBDOMAINS,
    finding: (f) => ({
      label: 'Multiple Subdomain Levels',
      severity: 'medium',
      detail: `${f.subdomain_count} subdomain levels detected; inspect the root domain carefully (${f.rootDomain}).`,
    }),
  },
  {
    id: 'excessive_hyphens',
    name: 'Excessive Hyphens in Hostname',
    test: (f) => f.hyphenCount >= 4,
    weight: HEURISTIC_WEIGHTS.EXCESSIVE_HYPHENS,
    finding: (f) => ({
      label: 'Excessive Hyphens in Hostname',
      severity: 'high',
      detail: `${f.hyphenCount} hyphens found in domain. Heavily hyphenated domains often attempt brand imitation.`,
    }),
  },
  {
    id: 'moderate_hyphens',
    name: 'Multiple Hyphens in Hostname',
    test: (f) => f.hyphenCount >= 2 && f.hyphenCount < 4,
    weight: HEURISTIC_WEIGHTS.MODERATE_HYPHENS,
    finding: (f) => ({
      label: 'Multiple Hyphens in Hostname',
      severity: 'low',
      detail: `${f.hyphenCount} hyphens detected in hostname.`,
    }),
  },
  {
    id: 'digit_clustering',
    name: 'Numeric Character Clustering',
    test: (f) => f.digitGroupCount >= 3,
    weight: HEURISTIC_WEIGHTS.DIGIT_GROUPS,
    finding: (f) => ({
      label: 'Multiple Numeric Groups in Domain',
      severity: 'medium',
      detail: `${f.digitGroupCount} numeric groups detected in domain name, consistent with automated domain generation.`,
    }),
  },
  {
    id: 'brand_impersonation',
    name: 'Brand Impersonation Triggers',
    test: (f) => f.brandMatches.length > 0,
    weight: (f) => Math.min(f.brandMatches.length * HEURISTIC_WEIGHTS.BRAND_MATCH_STEP, HEURISTIC_WEIGHTS.BRAND_MATCH_MAX),
    finding: (f) => ({
      label: 'Brand Impersonation Triggers',
      severity: f.brandMatches.length >= 2 ? 'high' : 'medium',
      detail: `Domain or path contains trusted brand references outside official domains: ${f.brandMatches.join(', ')}.`,
    }),
  },
  {
    id: 'urgency_keywords',
    name: 'Urgency Social Engineering Triggers',
    test: (f) => f.urgencyMatches.length > 0,
    weight: (f) => Math.min(f.urgencyMatches.length * HEURISTIC_WEIGHTS.URGENCY_MATCH_STEP, HEURISTIC_WEIGHTS.URGENCY_MATCH_MAX),
    finding: (f) => ({
      label: 'Urgent / Action Social Engineering Keywords',
      severity: f.urgencyMatches.length >= 2 ? 'high' : 'medium',
      detail: `Path or query contains high-urgency keywords: ${f.urgencyMatches.join(', ')}.`,
    }),
  },
  {
    id: 'long_hostname',
    name: 'Unusually Long Hostname',
    test: (f) => f.hostnameLength > 50,
    weight: HEURISTIC_WEIGHTS.LONG_HOSTNAME,
    finding: (f) => ({
      label: 'Unusually Long Hostname',
      severity: 'low',
      detail: `Hostname length is ${f.hostnameLength} characters. Legitimate consumer domains are typically shorter.`,
    }),
  },
  {
    id: 'unrecognized_tld',
    name: 'Missing Recognisable TLD',
    test: (f) => !f.isIpAddress && (!f.tld || f.tld.length < 2),
    weight: HEURISTIC_WEIGHTS.UNRECOGNIZED_TLD,
    finding: () => ({
      label: 'Unrecognised Domain Format',
      severity: 'medium',
      detail: 'The hostname does not end with a recognized top-level domain.',
    }),
  },
];

/**
 * Evaluates all heuristic rules against the input.
 */
export function evaluateUrlHeuristics(input) {
  const features = extractUrlFeatures(input);
  const findings = [];
  let score = 0;

  if (!features.valid) {
    return {
      score: 0,
      riskLevel: RISK_LEVELS.SAFE,
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

  for (const rule of HEURISTIC_RULES) {
    if (rule.test(features)) {
      const weight = typeof rule.weight === 'function' ? rule.weight(features) : rule.weight;
      score += weight;
      findings.push(rule.finding(features));
    }
  }

  score = Math.min(score, 100);

  let riskLevel = RISK_LEVELS.SAFE;
  if (score >= SCORING_THRESHOLDS.HIGH_RISK_MIN) {
    riskLevel = RISK_LEVELS.HIGH_RISK;
  } else if (score >= SCORING_THRESHOLDS.SUSPICIOUS_MIN) {
    riskLevel = RISK_LEVELS.SUSPICIOUS;
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
  HEURISTIC_RULES,
  extractUrlFeatures,
  evaluateUrlHeuristics,
};
