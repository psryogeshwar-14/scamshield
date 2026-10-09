import { RISK_LEVELS, THREAT_TYPES } from '../constants/threatTypes.js';

/**
 * Pure Message Fraud Signal Engine
 * ─────────────────────────────────
 * Detects social engineering, OTP coercion, payment scam, job fraud,
 * and malware delivery signals from plain text messages.
 */

const PAYMENT_KEYWORDS = ['upi', 'qr code', 'scan qr', 'refund', 'cashback', 'lottery', 'winner', 'claim prize', 'won $', 'won rs', 'payment bridge'];
const OTP_KEYWORDS = ['otp', 'one-time password', 'verification code', 'secret code', 'share your otp', 'share otp', 'send your otp'];
const URGENCY_KEYWORDS = ['blocked', 'suspended', 'immediately', 'urgent', 'today', '24 hours', 'deactivated', 'freeze', 'stop'];
const BANK_KEYWORDS = ['bank account', 'credit card', 'debit card', 'sbi', 'hdfc', 'icici', 'axis', 'paypal', 'paytm', 'sim', 'telecom'];
const JOB_KEYWORDS = ['job offer', 'part-time', 'part time', 'work from home', 'daily income', 'earn $', 'earn rs', 'telegram', 'badge fee', 'task fee'];
const PHISHING_KEYWORDS = ['password expired', 'login portal', 'lms portal', 're-authenticate', 'unusual login', 'verify your identity now'];
const MALWARE_KEYWORDS = ['.apk', '.exe', 'install file', 'download attached', 'security update app'];
const NORMAL_GREETINGS = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
const NORMAL_CONVERSATIONAL = [
  'hackathon', 'tomorrow', 'library', 'meeting', 'project', 'lunch',
  'class', 'notes', 'assignment', 'see you', 'thanks', 'thank you',
];

export function detectPaymentFraudSignals(text) {
  const lower = (text || '').toLowerCase();
  const matches = PAYMENT_KEYWORDS.filter((k) => lower.includes(k));
  return {
    matched: matches.length > 0,
    matches,
  };
}

export function detectOtpScamSignals(text) {
  const lower = (text || '').toLowerCase();
  const hasOtp = OTP_KEYWORDS.some((k) => lower.includes(k)) || (lower.includes('otp') && (lower.includes('share') || lower.includes('stop')));
  const hasUrgency = URGENCY_KEYWORDS.some((k) => lower.includes(k));
  const hasBank = BANK_KEYWORDS.some((k) => lower.includes(k));
  const matched = hasOtp && (hasUrgency || hasBank || lower.includes('share') || lower.includes('send') || lower.includes('stop'));

  return {
    matched,
    hasOtp,
    hasUrgency,
    hasBank,
  };
}

export function detectJobFraudSignals(text) {
  const lower = (text || '').toLowerCase();
  const hasJob = JOB_KEYWORDS.some((k) => lower.includes(k));
  const matched = hasJob && (lower.includes('telegram') || lower.includes('fee') || lower.includes('deposit') || URGENCY_KEYWORDS.some((k) => lower.includes(k)));
  return {
    matched,
    hasJob,
  };
}

export function detectPhishingSignals(text) {
  const lower = (text || '').toLowerCase();
  const hasPhishing = PHISHING_KEYWORDS.some((k) => lower.includes(k));
  const hasUrgency = URGENCY_KEYWORDS.some((k) => lower.includes(k));
  return {
    matched: hasPhishing && hasUrgency,
    hasPhishing,
    hasUrgency,
  };
}

export function detectMalwareSignals(text) {
  const lower = (text || '').toLowerCase();
  const matches = MALWARE_KEYWORDS.filter((k) => lower.includes(k));
  return {
    matched: matches.length > 0,
    matches,
  };
}

export function detectConversationalSignals(text) {
  const lower = (text || '').toLowerCase();
  const isGreeting = NORMAL_GREETINGS.includes(lower.trim());
  const hasConversationalWords = NORMAL_CONVERSATIONAL.some((w) => lower.includes(w));
  return {
    isGreeting,
    hasConversationalWords,
    matched: isGreeting || (hasConversationalWords && lower.length < 120),
  };
}

/**
 * Evaluates message text and returns a deterministic threat classification report.
 */
export function evaluateMessageSignals(message) {
  const text = (message || '').toLowerCase();

  // 1. Payment / QR Code / UPI Refund Fraud
  const payment = detectPaymentFraudSignals(text);
  if (payment.matched) {
    return {
      inputType: 'message',
      riskLevel: RISK_LEVELS.HIGH_RISK,
      threatType: THREAT_TYPES.PAYMENT_SCAM,
      confidence: 0.94,
      summary: 'This message shows clear signs of payment deception. Entering a UPI PIN or scanning reverse QR codes will DEBIT money from your account, not credit it.',
      evidence: [
        'Unsolicited claim of unexpected lottery winnings, refunds, or cash rewards',
        'Attempts to trick victim into scanning payment codes or entering authorization PINs',
      ],
      recommendedAction: 'Do not enter your PIN, do not scan any QR code, and do not transfer advance fees.',
      safetySteps: [
        'Remember: You NEVER need to enter your PIN to receive money',
        'Do not click attached payment links or scan unverified QR codes',
        'Report the fraudulent profile on your payment application',
      ],
      needsHumanConfirmation: false,
      limitations: 'Evaluated using deterministic financial fraud signatures.',
    };
  }

  // 2. OTP / Verification Code Scam
  const otp = detectOtpScamSignals(text);
  if (otp.matched) {
    return {
      inputType: 'message',
      riskLevel: RISK_LEVELS.HIGH_RISK,
      threatType: THREAT_TYPES.OTP_SCAM,
      confidence: 0.96,
      summary: 'This message attempts to pressure you into revealing an OTP or verification code under threat of account blocking. Legitimate institutions will NEVER ask for your OTP.',
      evidence: [
        'Requests a one-time password (OTP) or authorization PIN',
        'Fabricates extreme urgency to cause panic and bypass critical thinking',
        'Impersonates an authorized banking or administrative institution',
      ],
      recommendedAction: 'Do not share your OTP or click any link. Delete the message immediately.',
      safetySteps: [
        'Never disclose OTPs, passwords, or PINs to anyone, including bank staff',
        'Contact your bank or service provider through official phone numbers printed on your card or app',
        'Block and report the sender phone number or email address',
        'Check your transaction history directly in your official banking app',
      ],
      needsHumanConfirmation: false,
      limitations: 'Evaluated using deterministic social-engineering rule set.',
    };
  }

  // 3. Advance-Fee Job & Task Scams
  const job = detectJobFraudSignals(text);
  if (job.matched) {
    return {
      inputType: 'message',
      riskLevel: RISK_LEVELS.HIGH_RISK,
      threatType: THREAT_TYPES.FAKE_JOB,
      confidence: 0.91,
      summary: 'This message exhibits common recruitment fraud patterns promising unrealistic compensation for minimal work, typically funneling victims into Telegram deposit schemes.',
      evidence: [
        'Unsolicited employment or freelance task offer with unrealistic pay rates',
        'Redirection to unverified chat groups (Telegram/WhatsApp)',
        'Upfront fee or deposit requirement to unlock daily earnings',
      ],
      recommendedAction: 'Do not pay any registration fee and do not join third-party investment channels.',
      safetySteps: [
        'Legitimate companies never require job candidates to pay money upfront',
        'Verify open positions exclusively on official corporate career portals',
        'Report and block the sender contact',
      ],
      needsHumanConfirmation: false,
      limitations: 'Evaluated using deterministic recruitment scam detection rules.',
    };
  }

  // 4. Phishing / Account Takeover
  const phishing = detectPhishingSignals(text);
  if (phishing.matched) {
    return {
      inputType: 'message',
      riskLevel: RISK_LEVELS.HIGH_RISK,
      threatType: THREAT_TYPES.PHISHING,
      confidence: 0.90,
      summary: 'This message simulates an official IT or portal security alert designed to lure you into typing your credentials into a cloned website.',
      evidence: [
        'Claims your account will be disabled if not verified immediately',
        'Attempts credential harvesting through social engineering',
      ],
      recommendedAction: 'Do not follow links in this message. Visit your student or company portal directly.',
      safetySteps: [
        'Type the known official portal address directly into your browser',
        'Verify with your university IT desk if you suspect genuine account issues',
        'Change your account password immediately if you already entered it',
      ],
      needsHumanConfirmation: false,
      limitations: 'Evaluated using credential harvesting pattern matching.',
    };
  }

  // 5. Malware Delivery
  const malware = detectMalwareSignals(text);
  if (malware.matched) {
    return {
      inputType: 'message',
      riskLevel: RISK_LEVELS.HIGH_RISK,
      threatType: THREAT_TYPES.MALWARE,
      confidence: 0.93,
      summary: 'This message instructs you to install an unknown application or executable file, a primary vector for smartphone trojans and spyware.',
      evidence: [
        'Directs the user to sideload non-store executables or packages',
        'Attempts to bypass official application store security reviews',
      ],
      recommendedAction: 'Do not download, open, or install any attached file or package.',
      safetySteps: [
        'Delete the file if already downloaded without executing it',
        'Only install software from official sources (Google Play Store, Apple App Store)',
        'Run a mobile antivirus scan if you opened any package',
      ],
      needsHumanConfirmation: false,
      limitations: 'Evaluated based on suspicious executable payload indicators.',
    };
  }

  // 6. Benign Conversational Messages
  const conversational = detectConversationalSignals(text);
  if (conversational.matched && !otp.hasOtp && !payment.matched && !job.hasJob) {
    return {
      inputType: 'message',
      riskLevel: RISK_LEVELS.SAFE,
      threatType: THREAT_TYPES.UNKNOWN,
      confidence: 0.95,
      summary: 'No digital threat indicators were found in this message. The text represents regular conversational communication.',
      evidence: [
        'No requests for sensitive credentials, OTPs, or passwords',
        'No deceptive payment links or threat of service cancellation',
        'Standard everyday conversational context',
      ],
      recommendedAction: 'No threat detected. Maintain standard digital safety practices.',
      safetySteps: [
        'Always remain cautious if subsequent messages request financial transactions or security codes',
      ],
      needsHumanConfirmation: false,
      limitations: 'Heuristic classification cannot confirm the real-life sender identity.',
    };
  }

  // Default: Ambiguous / Low Context Message
  return {
    inputType: 'message',
    riskLevel: RISK_LEVELS.SUSPICIOUS,
    threatType: THREAT_TYPES.UNKNOWN,
    confidence: 0.65,
    summary: 'The message contains limited context. While no overt fraud triggers were detected, exercise caution with unsolicited texts.',
    evidence: [
      'Message lacks established sender context or official verification',
      'No explicit credential harvesting detected in provided text',
    ],
    recommendedAction: 'Exercise caution. Verify the sender identity before clicking links or sharing information.',
    safetySteps: [
      'Contact the sender through a secondary verified communication channel',
      'Never transfer funds or share private information with unknown contacts',
    ],
    needsHumanConfirmation: true,
    limitations: 'Heuristic evaluation based on partial textual context.',
  };
}

export default {
  detectPaymentFraudSignals,
  detectOtpScamSignals,
  detectJobFraudSignals,
  detectPhishingSignals,
  detectMalwareSignals,
  detectConversationalSignals,
  evaluateMessageSignals,
};
