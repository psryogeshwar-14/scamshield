import prisma from '../src/utils/prismaClient.js';

/**
 * Safe Demo Seed Script for ScamShield.
 * Populates the local SQLite database with realistic evaluation demo records.
 * Contains only synthetic/fictional sample threats. Zero real secrets or PII.
 */
async function main() {
  console.log('🌱 Seeding ScamShield database with safe evaluation records...');

  // 1. Phishing URL Threat Record
  const phishingCheck = await prisma.threatCheck.create({
    data: {
      inputType: 'url',
      userInput: 'http://secure-paypal-verify.login-update.xyz',
      riskLevel: 'high_risk',
      threatType: 'impersonation',
      confidence: 0.95,
      summary: 'Suspicious domain impersonating PayPal using an unencrypted HTTP protocol and a high-abuse .xyz top-level domain.',
      evidenceJson: JSON.stringify([
        'Brand keyword "paypal" in subdomain on non-official host',
        'Insecure unencrypted HTTP protocol (missing TLS/SSL certificate)',
        'Excessive subdomains (secure-paypal-verify.login-update)',
        'Registered under high-risk .xyz top-level domain'
      ]),
      recommendedAction: 'Close the tab immediately and do not submit any credentials or two-factor codes.',
      safetyStepsJson: JSON.stringify([
        'Close this webpage immediately',
        'Verify your account by typing paypal.com directly in a new browser tab',
        'If you already entered a password, change your credentials from a known safe device',
        'Report this URL to your institutional security operations center (SOC)'
      ]),
      safeBrowsingResult: JSON.stringify({
        status: 'clean',
        threats: [],
        details: 'No known match in global catalog (zero-day risk mitigated by structural heuristics)'
      }),
      safetyRecommendations: {
        create: [
          { action: 'Close this webpage immediately', completed: true },
          { action: 'Verify your account by typing official website URL directly', completed: false },
          { action: 'Change compromised passwords from a safe device', completed: false },
          { action: 'Report link to university IT helpdesk', completed: false }
        ]
      }
    }
  });

  // 2. Urgent SMS Scam Message Record
  const messageCheck = await prisma.threatCheck.create({
    data: {
      inputType: 'message',
      userInput: 'Your student portal access will be terminated within 2 hours. Send your 6-digit verification code to retain access.',
      riskLevel: 'high_risk',
      threatType: 'otp_scam',
      confidence: 0.92,
      summary: 'Social engineering attack exploiting artificial urgency to harvest one-time authentication codes.',
      evidenceJson: JSON.stringify([
        'Urgent deadline coercion ("within 2 hours")',
        'Direct solicitation of sensitive 6-digit verification code / OTP',
        'Impersonation of institutional administrator authority'
      ]),
      recommendedAction: 'Never share your one-time passwords (OTP) or authentication codes with anyone.',
      safetyStepsJson: JSON.stringify([
        'Do not reply or share any verification codes',
        'Forward the fraudulent SMS to your telecom spam reporting number (7726)',
        'Check your official student portal notification inbox directly',
        'Notify your university cybersecurity team of targeted phishing attempts'
      ]),
      safeBrowsingResult: null,
      safetyRecommendations: {
        create: [
          { action: 'Do not reply or share any verification codes', completed: true },
          { action: 'Forward the fraudulent SMS to spam reporting', completed: false },
          { action: 'Check your official student portal directly', completed: false }
        ]
      }
    }
  });

  // 3. Clean Portal Record
  const safeCheck = await prisma.threatCheck.create({
    data: {
      inputType: 'url',
      userInput: 'https://www.google.com',
      riskLevel: 'safe',
      threatType: 'none',
      confidence: 0.99,
      summary: 'Legitimate search engine domain operating over encrypted HTTPS with valid domain certificates.',
      evidenceJson: JSON.stringify([
        'Encrypted HTTPS protocol active',
        'Verified official domain root (google.com)',
        'No suspicious structural flags or brand spoofing observed'
      ]),
      recommendedAction: 'The inspected URL appears legitimate and safe for standard navigation.',
      safetyStepsJson: JSON.stringify([
        'Standard browsing safe',
        'Verify address bar shows padlock icon in your browser'
      ]),
      safeBrowsingResult: JSON.stringify({
        status: 'clean',
        threats: [],
        details: 'Verified clean by Google Safe Browsing Lookup v4'
      }),
      safetyRecommendations: {
        create: [
          { action: 'Standard browsing safe', completed: true }
        ]
      }
    }
  });

  console.log(`✅ Seeded 3 evaluation records successfully:`);
  console.log(`   - Phishing URL: [${phishingCheck.id}]`);
  console.log(`   - OTP Scam:     [${messageCheck.id}]`);
  console.log(`   - Safe Portal:  [${safeCheck.id}]`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
