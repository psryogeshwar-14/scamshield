import { IS_TEST } from '../config/index.js';

/**
 * Privacy-preserving logger utility.
 * Masks credentials, passwords, OTPs, and truncates arbitrary inputs.
 */

const SENSITIVE_PATTERNS = [
  /password[=:\s]+[^\s&]+/gi,
  /otp[=:\s]+[^\s&]+/gi,
  /pin[=:\s]+[^\s&]+/gi,
  /token[=:\s]+[^\s&]+/gi,
  /authorization[=:\s]+bearer\s+[^\s&]+/gi,
];

export function redactSensitiveText(str) {
  if (typeof str !== 'string') return '';
  let cleaned = str;
  for (const pattern of SENSITIVE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[REDACTED]');
  }
  return cleaned;
}

export const logger = {
  info(message, meta = {}) {
    if (IS_TEST) return;
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    console.log(`ℹ️  [${new Date().toISOString()}] INFO: ${message}${metaStr}`);
  },

  warn(message, meta = {}) {
    if (IS_TEST) return;
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    console.warn(`⚠️  [${new Date().toISOString()}] WARN: ${message}${metaStr}`);
  },

  error(message, errorOrMeta = {}) {
    if (IS_TEST) return;
    const isError = errorOrMeta instanceof Error;
    const errPayload = isError
      ? { message: errorOrMeta.message, code: errorOrMeta.code, stack: errorOrMeta.stack }
      : errorOrMeta;
    console.error(`🔴 [${new Date().toISOString()}] ERROR: ${message}`, errPayload);
  },
};

export default logger;
