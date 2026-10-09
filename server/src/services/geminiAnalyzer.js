import { GoogleGenAI, Type } from '@google/genai';
import { isGeminiConfigured, TIMEOUTS } from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Strict JSON Schema definition for Gemini structured output.
 */
export const SCAM_SHIELD_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    inputType: {
      type: Type.STRING,
      enum: ['url', 'message'],
      description: 'The type of input evaluated',
    },
    riskLevel: {
      type: Type.STRING,
      enum: ['safe', 'suspicious', 'high_risk'],
      description: 'Overall risk severity category',
    },
    threatType: {
      type: Type.STRING,
      enum: [
        'phishing',
        'otp_scam',
        'payment_scam',
        'fake_job',
        'malware',
        'impersonation',
        'account_takeover',
        'social_engineering',
        'unknown',
      ],
      description: 'Specific digital threat classification',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Confidence metric between 0.0 and 1.0',
    },
    summary: {
      type: Type.STRING,
      description: 'Plain-language explanation of findings suitable for students',
    },
    evidence: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Concrete indicators and facts supporting this classification',
    },
    recommendedAction: {
      type: Type.STRING,
      description: 'Top immediate directive for the user',
    },
    safetySteps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Step-by-step ordered defensive checklist',
    },
    needsHumanConfirmation: {
      type: Type.BOOLEAN,
      description: 'True if user should verify with a verified official authority',
    },
    limitations: {
      type: Type.STRING,
      description: 'Explanation of analysis constraints and disclaimers',
    },
  },
  required: [
    'inputType',
    'riskLevel',
    'threatType',
    'confidence',
    'summary',
    'evidence',
    'recommendedAction',
    'safetySteps',
    'needsHumanConfirmation',
  ],
};

const SYSTEM_INSTRUCTION = `
You are ScamShield, an AI cybersecurity and digital safety assistant specifically designed for students.
Your mission is to protect students from cyber fraud, phishing links, fake job offers, and OTP theft.

Guidelines:
1. Classify risk into strictly one of: "safe", "suspicious", "high_risk".
2. Categorize threat types into: phishing, otp_scam, payment_scam, fake_job, malware, impersonation, account_takeover, social_engineering, or unknown.
3. Ground your explanation only in verified facts and observable patterns in the input. Never invent claims or assume unverifiable facts.
4. If input is ambiguous or has limited context, categorize as "suspicious" rather than "high_risk".
5. Provide actionable, concise safety steps without technical jargon.
6. Acknowledge that automated detection is educational guidance, never an absolute guarantee.
7. Return valid JSON strictly adhering to the responseSchema.
`.trim();

/**
 * Validates and sanitizes model output against strict application constraints.
 */
export function sanitizeResult(data, inputType = 'message') {
  const allowedRisk = ['safe', 'suspicious', 'high_risk'];
  const allowedThreats = [
    'phishing',
    'otp_scam',
    'payment_scam',
    'fake_job',
    'malware',
    'impersonation',
    'account_takeover',
    'social_engineering',
    'unknown',
  ];

  const riskLevel = allowedRisk.includes(data?.riskLevel) ? data.riskLevel : 'suspicious';
  const threatType = allowedThreats.includes(data?.threatType) ? data.threatType : 'unknown';

  let confidence = typeof data?.confidence === 'number' && !isNaN(data.confidence)
    ? Math.max(0.1, Math.min(1.0, Math.round(data.confidence * 100) / 100))
    : 0.85;

  const summary = typeof data?.summary === 'string' && data.summary.trim().length > 0
    ? data.summary.trim()
    : 'Safety evaluation completed based on structural and contextual indicators.';

  const evidence = Array.isArray(data?.evidence) && data.evidence.length > 0
    ? data.evidence.map((item) => String(item).trim()).filter(Boolean)
    : ['Standard pattern evaluation conducted.'];

  const recommendedAction = typeof data?.recommendedAction === 'string' && data.recommendedAction.trim().length > 0
    ? data.recommendedAction.trim()
    : 'Do not click links or share credentials until independently verified.';

  const safetySteps = Array.isArray(data?.safetySteps) && data.safetySteps.length > 0
    ? data.safetySteps.map((step) => String(step).trim()).filter(Boolean)
    : [
        'Never disclose passwords, OTPs, or financial pins to unverified callers or messages',
        'Check account status through official websites or applications directly',
      ];

  const limitations = typeof data?.limitations === 'string' && data.limitations.trim().length > 0
    ? data.limitations.trim()
    : 'Automated guidance based on pattern analysis; not a substitute for official organizational IT counsel.';

  return {
    inputType: inputType === 'url' ? 'url' : 'message',
    riskLevel,
    threatType,
    confidence,
    summary,
    evidence,
    recommendedAction,
    safetySteps,
    needsHumanConfirmation: Boolean(data?.needsHumanConfirmation),
    limitations,
  };
}

/**
 * Deterministic fallback analysis for suspicious messages when Gemini is unavailable.
 */
export function fallbackAnalyzeMessage(message) {
  const text = (message || '').toLowerCase();

  // Pattern 1: Payment / QR Code / UPI Refund Fraud
  const paymentKeywords = ['upi', 'qr code', 'scan qr', 'refund', 'cashback', 'lottery', 'winner', 'claim prize', 'won $', 'won rs', 'payment bridge'];
  const hasPayment = paymentKeywords.some((k) => text.includes(k));

  if (hasPayment) {
    return {
      inputType: 'message',
      riskLevel: 'high_risk',
      threatType: 'payment_scam',
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

  // Pattern 2: OTP / Verification Code Scam
  const otpKeywords = ['otp', 'one-time password', 'verification code', 'secret code', 'share your otp', 'share otp', 'send your otp'];
  const urgencyKeywords = ['blocked', 'suspended', 'immediately', 'urgent', 'today', '24 hours', 'deactivated', 'freeze', 'stop'];
  const bankKeywords = ['bank account', 'credit card', 'debit card', 'sbi', 'hdfc', 'icici', 'axis', 'paypal', 'paytm', 'sim', 'telecom'];

  const hasOtp = otpKeywords.some((k) => text.includes(k)) || (text.includes('otp') && (text.includes('share') || text.includes('stop')));
  const hasUrgency = urgencyKeywords.some((k) => text.includes(k));
  const hasBank = bankKeywords.some((k) => text.includes(k));

  if (hasOtp && (hasUrgency || hasBank || text.includes('share') || text.includes('send') || text.includes('stop'))) {
    return {
      inputType: 'message',
      riskLevel: 'high_risk',
      threatType: 'otp_scam',
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

  // Pattern 3: Advance-Fee Job & Task Scams
  const jobKeywords = ['job offer', 'part-time', 'part time', 'work from home', 'daily income', 'earn $', 'earn rs', 'telegram', 'badge fee', 'task fee'];
  const hasJob = jobKeywords.some((k) => text.includes(k));

  if (hasJob && (text.includes('telegram') || text.includes('fee') || text.includes('deposit') || hasUrgency)) {
    return {
      inputType: 'message',
      riskLevel: 'high_risk',
      threatType: 'fake_job',
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

  // Pattern 4: Phishing / Account Takeover
  const phishingKeywords = ['password expired', 'login portal', 'lms portal', 're-authenticate', 'unusual login', 'verify your identity now'];
  const hasPhishing = phishingKeywords.some((k) => text.includes(k));

  if (hasPhishing && hasUrgency) {
    return {
      inputType: 'message',
      riskLevel: 'high_risk',
      threatType: 'phishing',
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

  // Pattern 5: Malware Delivery
  const malwareKeywords = ['.apk', '.exe', 'install file', 'download attached', 'security update app'];
  const hasMalware = malwareKeywords.some((k) => text.includes(k));

  if (hasMalware) {
    return {
      inputType: 'message',
      riskLevel: 'high_risk',
      threatType: 'malware',
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

  // Pattern 6: Benign Everyday Conversational Messages
  const normalGreetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
  const normalConversational = [
    'hackathon', 'tomorrow', 'library', 'meeting', 'project', 'lunch',
    'class', 'notes', 'assignment', 'see you', 'thanks', 'thank you',
  ];

  const isGreeting = normalGreetings.includes(text.trim());
  const isConversational = normalConversational.some((w) => text.includes(w)) && !hasOtp && !hasPayment && !hasJob;

  if (isGreeting || (isConversational && text.length < 120)) {
    return {
      inputType: 'message',
      riskLevel: 'safe',
      threatType: 'unknown',
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
    riskLevel: 'suspicious',
    threatType: 'unknown',
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

/**
 * Deterministic fallback analysis for URLs when Gemini is unavailable.
 */
export function fallbackAnalyzeUrl(url, heuristics, safeBrowsing) {
  const isHighRisk = heuristics.riskLevel === 'high_risk' || safeBrowsing.status === 'threat';
  const isSuspicious = heuristics.riskLevel === 'suspicious';

  const evidenceList = (heuristics.findings || []).map((f) => `${f.label}: ${f.detail}`);
  if (safeBrowsing.status === 'threat') {
    evidenceList.unshift('Flagged as active threat in Google Safe Browsing threat lists');
  }

  if (isHighRisk) {
    const isBrand = heuristics.features?.brandMatches?.length > 0;
    const threatType = isBrand ? 'impersonation' : safeBrowsing.status === 'threat' ? 'malware' : 'phishing';

    return {
      inputType: 'url',
      riskLevel: 'high_risk',
      threatType,
      confidence: Math.min(0.98, Math.max(0.85, (heuristics.score || 80) / 100)),
      summary: `This web link displays critical hazard indicators: ${evidenceList.slice(0, 2).join('; ')}. It likely attempts to deceive visitors or harvest credentials.`,
      evidence: evidenceList.length > 0 ? evidenceList : ['Dangerous domain structural indicators observed'],
      recommendedAction: 'Do not visit this site or input any credentials or personal information.',
      safetySteps: [
        'Do not open this URL in your web browser',
        'Never submit student ID numbers, passwords, or credit card details on this domain',
        'If shared in a campus group chat, warn peers about the threat',
        'Report this URL to your university IT support and Google Safe Browsing',
      ],
      needsHumanConfirmation: false,
      limitations: 'Analysis synthesized from structural heuristics and reputation signals.',
    };
  }

  if (isSuspicious) {
    return {
      inputType: 'url',
      riskLevel: 'suspicious',
      threatType: 'unknown',
      confidence: 0.75,
      summary: 'This URL contains structural anomalies such as unencrypted HTTP, an unusual top-level domain, or multiple subdomains. Proceed with caution.',
      evidence: evidenceList.length > 0 ? evidenceList : ['Unusual structural URL attributes observed'],
      recommendedAction: 'Avoid entering sensitive credentials or making payments on this website.',
      safetySteps: [
        'Confirm the domain precisely matches the organization you intended to visit',
        'Ensure communication is protected by valid HTTPS encryption',
        'If redirected to a login portal, open the service from a trusted bookmark instead',
      ],
      needsHumanConfirmation: true,
      limitations: 'Heuristic analysis flags syntactic anomalies; human verification recommended.',
    };
  }

  return {
    inputType: 'url',
    riskLevel: 'safe',
    threatType: 'unknown',
    confidence: 0.92,
    summary: 'No suspicious security signals were flagged in this URL. The protocol, hostname structure, and domain attributes appear legitimate.',
    evidence: evidenceList.length > 0 ? evidenceList : ['Standard domain format', 'No suspicious structural indicators flagged'],
    recommendedAction: 'The link appears safe to browse. Maintain normal digital safety practices.',
    safetySteps: [
      'Verify the browser address bar still shows the expected domain after loading',
      'Never input passwords if you are unexpectedly redirected to another domain',
    ],
    needsHumanConfirmation: false,
    limitations: 'Heuristic analysis cannot detect zero-day exploits or newly compromised websites.',
  };
}

/**
 * Analyzes a message with Gemini AI using structured output schema,
 * falling back gracefully to deterministic analysis on failure.
 */
export async function analyzeMessageWithGemini(message) {
  if (!isGeminiConfigured()) {
    return fallbackAnalyzeMessage(message);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = `
Analyze the following user-submitted message for security threats and scams.

User Message:
"""
${message}
"""

Evaluate for scams (phishing, OTP fraud, payment scams, fake jobs, impersonation, malware).
Explain in simple terms for students and return strictly according to responseSchema.
`.trim();

    // Enforce safe external timeout
    const apiPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: SCAM_SHIELD_RESPONSE_SCHEMA,
        temperature: 0.1,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini API timed out after ${TIMEOUTS.GEMINI_MS}ms`)), TIMEOUTS.GEMINI_MS)
    );

    const response = await Promise.race([apiPromise, timeoutPromise]);
    const parsed = JSON.parse(response.text);
    return sanitizeResult(parsed, 'message');
  } catch (err) {
    logger.warn(`Gemini message analysis fallback triggered: ${err.message}`);
    const fallback = fallbackAnalyzeMessage(message);
    fallback._fallbackNote = `Analyzed using ScamShield deterministic engine (${err.message})`;
    return fallback;
  }
}

/**
 * Analyzes a URL with Gemini AI grounded on factual heuristics and Safe Browsing,
 * falling back gracefully on failure.
 */
export async function analyzeUrlWithGemini(url, heuristics, safeBrowsing) {
  if (!isGeminiConfigured()) {
    return fallbackAnalyzeUrl(url, heuristics, safeBrowsing);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = `
Explain the security posture of this URL based on the factual evidence provided below.
DO NOT invent facts not supported by the evidence.

Target URL: ${url}

Heuristic Score: ${heuristics.score}/100
Heuristic Risk Level: ${heuristics.riskLevel}
Heuristic Findings:
${JSON.stringify(heuristics.findings || [], null, 2)}

URL Features:
${JSON.stringify(heuristics.features || {}, null, 2)}

Google Safe Browsing Status:
${JSON.stringify(safeBrowsing, null, 2)}

Explain why this URL is safe, suspicious, or high_risk in simple language for students.
Return strictly according to responseSchema.
`.trim();

    const apiPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: SCAM_SHIELD_RESPONSE_SCHEMA,
        temperature: 0.1,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini API timed out after ${TIMEOUTS.GEMINI_MS}ms`)), TIMEOUTS.GEMINI_MS)
    );

    const response = await Promise.race([apiPromise, timeoutPromise]);
    const parsed = JSON.parse(response.text);
    return sanitizeResult(parsed, 'url');
  } catch (err) {
    logger.warn(`Gemini URL analysis fallback triggered: ${err.message}`);
    const fallback = fallbackAnalyzeUrl(url, heuristics, safeBrowsing);
    fallback._fallbackNote = `Analyzed using ScamShield deterministic engine (${err.message})`;
    return fallback;
  }
}

export default {
  SCAM_SHIELD_RESPONSE_SCHEMA,
  sanitizeResult,
  fallbackAnalyzeMessage,
  fallbackAnalyzeUrl,
  analyzeMessageWithGemini,
  analyzeUrlWithGemini,
};
