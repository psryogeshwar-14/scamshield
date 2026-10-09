import { describe, it, expect } from 'vitest';
import {
  normalizeUrl,
  isIpAddress,
  extractRootDomain,
  parseUrlFeatures,
  runHeuristicChecks,
} from '../../src/services/urlAnalyzer.js';
import { FIXTURES } from '../fixtures/threatFixtures.js';

describe('urlAnalyzer — Unit Tests', () => {
  describe('normalizeUrl()', () => {
    it('normalizes valid HTTPS URL correctly', () => {
      const normalized = normalizeUrl('HTTPS://WWW.Google.com/');
      expect(normalized).toBe('https://www.google.com/');
    });

    it('prepends https:// when protocol is missing', () => {
      const normalized = normalizeUrl('github.com/explore');
      expect(normalized).toBe('https://github.com/explore');
    });

    it('collapses duplicate path slashes safely', () => {
      const normalized = normalizeUrl('https://example.com///path//to///resource');
      expect(normalized).toBe('https://example.com/path/to/resource');
    });

    it('returns null for unparseable input', () => {
      expect(normalizeUrl('')).toBeNull();
      expect(normalizeUrl('   ')).toBeNull();
      expect(normalizeUrl('::not-a-valid-uri::')).toBeNull();
    });
  });

  describe('isIpAddress()', () => {
    it('identifies standard IPv4 addresses', () => {
      expect(isIpAddress('192.168.1.1')).toBe(true);
      expect(isIpAddress('10.0.0.1')).toBe(true);
      expect(isIpAddress('172.16.254.1')).toBe(true);
      expect(isIpAddress('8.8.8.8')).toBe(true);
    });

    it('rejects regular domains and invalid IPs', () => {
      expect(isIpAddress('google.com')).toBe(false);
      expect(isIpAddress('999.999.999.999')).toBe(false);
      expect(isIpAddress('192.168.1')).toBe(false);
      expect(isIpAddress('example.192.168.1.1')).toBe(false);
    });

    it('identifies IPv6 hostnames', () => {
      expect(isIpAddress('[2001:db8::1]')).toBe(true);
      expect(isIpAddress('::1')).toBe(true);
    });
  });

  describe('extractRootDomain()', () => {
    it('extracts eTLD+1 for standard domains', () => {
      expect(extractRootDomain('secure.login.paypal.com')).toBe('paypal.com');
      expect(extractRootDomain('subdomain.example.org')).toBe('example.org');
    });

    it('handles multi-part country code TLDs', () => {
      expect(extractRootDomain('portal.student.ac.in')).toBe('student.ac.in');
      expect(extractRootDomain('news.bbc.co.uk')).toBe('bbc.co.uk');
      expect(extractRootDomain('onlinesbi.sbi.co.in')).toBe('sbi.co.in');
    });
  });

  describe('parseUrlFeatures()', () => {
    it('extracts structured protocol, host, and path features', () => {
      const features = parseUrlFeatures('http://secure-paypal-verify.login-update.xyz/auth?user=test');
      expect(features.valid).toBe(true);
      expect(features.isHttp).toBe(true);
      expect(features.isHttps).toBe(false);
      expect(features.isSuspiciousTld).toBe(true);
      expect(features.tld).toBe('xyz');
      expect(features.brandMatches).toContain('paypal');
      expect(features.hasQueryParams).toBe(true);
      expect(features.queryParams.user).toBe('test');
    });

    it('detects URL shorteners', () => {
      const features = parseUrlFeatures(FIXTURES.suspiciousShortenerUrl);
      expect(features.valid).toBe(true);
      expect(features.isShortener).toBe(true);
    });

    it('does not flag official brand domains as brand impersonation', () => {
      const features = parseUrlFeatures('https://www.paypal.com/signin');
      expect(features.brandMatches).toHaveLength(0);
    });
  });

  describe('runHeuristicChecks() & Risk Scoring', () => {
    it('evaluates safe URL with low score and "safe" risk level', () => {
      const result = runHeuristicChecks(FIXTURES.safeUrl);
      expect(result.score).toBeLessThan(30);
      expect(result.riskLevel).toBe('safe');
      expect(result.findings[0].severity).toBe('none');
    });

    it('evaluates unencrypted HTTP as suspicious or penalized', () => {
      const result = runHeuristicChecks(FIXTURES.suspiciousHttpUrl);
      expect(result.score).toBeGreaterThanOrEqual(20);
      const httpFinding = result.findings.find((f) => f.label.includes('HTTP'));
      expect(httpFinding).toBeDefined();
    });

    it('flags raw IP hostname with severe score penalty', () => {
      const result = runHeuristicChecks(FIXTURES.highRiskIpUrl);
      expect(result.score).toBeGreaterThanOrEqual(35);
      const ipFinding = result.findings.find((f) => f.label.includes('IP-Address'));
      expect(ipFinding).toBeDefined();
      expect(ipFinding.severity).toBe('high');
    });

    it('flags high-risk brand impersonation with score >= 60 and "high_risk"', () => {
      const result = runHeuristicChecks(FIXTURES.highRiskPhishingUrl);
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.riskLevel).toBe('high_risk');
      expect(result.findings.some((f) => f.label.includes('Brand'))).toBe(true);
      expect(result.findings.some((f) => f.label.includes('TLD'))).toBe(true);
    });

    it('handles unparseable input gracefully', () => {
      const result = runHeuristicChecks(FIXTURES.invalidUrlText);
      expect(result.riskLevel).toBe('safe');
      expect(result.score).toBe(0);
      expect(result.limitations).toBeDefined();
    });
  });
});
