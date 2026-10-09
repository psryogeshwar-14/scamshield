/**
 * threatFixtures.js
 * ─────────────────
 * Reusable test fixtures for security testing across unit, integration, and E2E suites.
 */

export const FIXTURES = {
  // Safe Targets
  safeUrl: 'https://www.google.com',
  safeUrlWithSubdomain: 'https://docs.python.org/3/library/index.html',
  safeMessage: 'Hey, are you coming to the hackathon tomorrow at 10 AM?',
  safeGreeting: 'Hello there! Good morning.',

  // Suspicious Targets
  suspiciousHttpUrl: 'http://my-student-blog.online',
  suspiciousTldUrl: 'https://updates-notice.xyz',
  suspiciousShortenerUrl: 'https://bit.ly/3xYz123',
  suspiciousMessage: 'Unverified parcel notification: Your delivery #8271 is pending address confirmation.',

  // High-Risk Malicious Targets
  highRiskPhishingUrl: 'http://secure-paypal-verify.login-update.xyz',
  highRiskIpUrl: 'http://192.168.1.100/admin/login.php',
  highRiskBrandSpoofUrl: 'https://google.com-account-verify.security-alert.top/signin',
  highRiskOtpScamMessage: 'Your bank account will be blocked today. Share your OTP to stop it.',
  highRiskJobScamMessage: 'Congratulations! You are selected for high-pay online part-time job. Earn $300/day. Join Telegram and pay $20 fee to start immediately.',
  highRiskPaymentScamMessage: 'You won $5000 lottery cash prize! Scan this UPI QR code and enter your secret PIN to receive your refund immediately.',
  highRiskMalwareMessage: 'Critical security update: Download and install the update.apk package attached to secure your device.',

  // Malformed & Invalid Inputs
  invalidUrlText: 'not a url at all with spaces',
  oversizedUrl: 'https://example.com/' + 'a'.repeat(3000),
  oversizedMessage: 'Suspicious text '.repeat(600), // > 5000 chars
  controlCharUrl: 'https://example.com/\x00test',
  emptyInput: '',
};

export default FIXTURES;
