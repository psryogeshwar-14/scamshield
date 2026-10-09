import { GoogleGenAI, Type } from '@google/genai';
import { isGeminiConfigured, getGeminiApiKey, TIMEOUTS } from '../config/index.js';
import {
  validateAndSanitizeGeminiResponse,
  buildMessageAnalysisPrompt,
  buildUrlAnalysisPrompt,
} from '../domain/geminiValidation.js';

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

export const SYSTEM_INSTRUCTION = `
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
 * Invokes Gemini API with timeout protection and structured output schema.
 *
 * @param {string} prompt - Prompt content
 * @param {Object} [options]
 * @param {number} [options.timeoutMs]
 * @returns {Promise<Object>} Raw parsed response from model
 */
export async function generateStructuredAnalysis(prompt, { timeoutMs = TIMEOUTS.GEMINI_MS } = {}) {
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

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

  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`Gemini API timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  try {
    const response = await Promise.race([apiPromise, timeoutPromise]);
    return JSON.parse(response.text);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Calls Gemini for message analysis or throws error if unavailable/failed.
 *
 * @param {string} message
 * @param {Object} [options]
 * @returns {Promise<Object>} Sanitized Gemini response
 */
export async function callGeminiForMessage(message, options = {}) {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key is not configured.');
  }

  const prompt = buildMessageAnalysisPrompt(message);
  const raw = await generateStructuredAnalysis(prompt, options);
  return validateAndSanitizeGeminiResponse(raw, 'message');
}

/**
 * Calls Gemini for URL analysis grounded in heuristics or throws error if unavailable/failed.
 *
 * @param {string} url
 * @param {Object} heuristics
 * @param {Object} safeBrowsing
 * @param {Object} [options]
 * @returns {Promise<Object>} Sanitized Gemini response
 */
export async function callGeminiForUrl(url, heuristics, safeBrowsing, options = {}) {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key is not configured.');
  }

  const prompt = buildUrlAnalysisPrompt(url, heuristics, safeBrowsing);
  const raw = await generateStructuredAnalysis(prompt, options);
  return validateAndSanitizeGeminiResponse(raw, 'url');
}

export default {
  SCAM_SHIELD_RESPONSE_SCHEMA,
  SYSTEM_INSTRUCTION,
  generateStructuredAnalysis,
  callGeminiForMessage,
  callGeminiForUrl,
};
