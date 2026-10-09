/**
 * ScamShield Domain Constants & Enums
 * ──────────────────────────────────
 * Eliminates magic strings and numbers across the backend.
 */

export const RISK_LEVELS = Object.freeze({
  SAFE: 'safe',
  SUSPICIOUS: 'suspicious',
  HIGH_RISK: 'high_risk',
});

export const THREAT_TYPES = Object.freeze({
  PHISHING: 'phishing',
  OTP_SCAM: 'otp_scam',
  PAYMENT_SCAM: 'payment_scam',
  FAKE_JOB: 'fake_job',
  MALWARE: 'malware',
  IMPERSONATION: 'impersonation',
  ACCOUNT_TAKEOVER: 'account_takeover',
  SOCIAL_ENGINEERING: 'social_engineering',
  UNKNOWN: 'unknown',
});

export const INPUT_TYPES = Object.freeze({
  URL: 'url',
  MESSAGE: 'message',
});

export const SAFE_BROWSING_STATUS = Object.freeze({
  CLEAN: 'clean',
  THREAT: 'threat',
  UNAVAILABLE: 'unavailable',
});

export const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  REC_NOT_FOUND: 'REC_NOT_FOUND',
  DATABASE_ERROR: 'DATABASE_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  TIMEOUT: 'TIMEOUT',
  SERVICE_UNREACHABLE: 'SERVICE_UNREACHABLE',
  NOT_FOUND: 'NOT_FOUND',
  CORS_FORBIDDEN: 'CORS_FORBIDDEN',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  SERVER_ERROR: 'SERVER_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  INVALID_ID: 'INVALID_ID',
  INVALID_REC_ID: 'INVALID_REC_ID',
  INVALID_INPUT_TYPE: 'INVALID_INPUT_TYPE',
});

export const SCORING_THRESHOLDS = Object.freeze({
  HIGH_RISK_MIN: 60,
  SUSPICIOUS_MIN: 30,
});

export const HEURISTIC_WEIGHTS = Object.freeze({
  HTTP_UNENCRYPTED: 20,
  IP_ADDRESS_HOST: 35,
  URL_SHORTENER: 25,
  SUSPICIOUS_TLD: 20,
  EXCESSIVE_SUBDOMAINS: 25,
  MODERATE_SUBDOMAINS: 12,
  EXCESSIVE_HYPHENS: 20,
  MODERATE_HYPHENS: 10,
  DIGIT_GROUPS: 15,
  BRAND_MATCH_MAX: 40,
  BRAND_MATCH_STEP: 20,
  URGENCY_MATCH_MAX: 25,
  URGENCY_MATCH_STEP: 10,
  LONG_HOSTNAME: 10,
  UNRECOGNIZED_TLD: 15,
});

export const DEFAULT_PAGINATION = Object.freeze({
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
});
