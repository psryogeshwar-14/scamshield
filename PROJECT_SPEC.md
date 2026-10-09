# ScamShield — AI Digital Safety Assistant

## Hackathon
PromptWars X Error Zero — AI-Powered Cybersecurity & Digital Safety.

## Problem
Students receive phishing links, scam messages, fake payment requests, and OTP-fraud attempts.
They need a simple way to understand whether something is risky and what action to take.

## Solution
ScamShield lets a user paste a URL or suspicious message.
The app analyzes it, explains the risk in simple language, and gives actionable safety recommendations.

## Core user flow
1. User opens ScamShield.
2. User selects “Check URL” or “Check Message.”
3. User pastes input.
4. User clicks “Analyze Safety.”
5. App shows risk level, threat type, evidence, explanation, and safety actions.
6. App saves the analysis in history.

## Required features
- URL analyzer with heuristics
- Google Safe Browsing URL reputation check
- Gemini-powered threat explanation and classification
- Scam-message classifier
- Risk levels: safe, suspicious, high_risk
- Plain-language explanation
- Actionable safety steps
- Analysis history dashboard
- Loading, empty, invalid-input, and API-failure states
- Responsive dark security-dashboard UI
- Accessible keyboard navigation and readable contrast

## Tech stack
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: Prisma + SQLite
- AI: Gemini API with structured JSON output
- URL safety: Google Safe Browsing Lookup API
- Deployment: Vercel for frontend, Render/Railway or Vercel serverless functions for backend

## Security rules
- Never hardcode API keys.
- Use environment variables.
- Validate all user input.
- Do not execute user-provided URLs.
- Do not automatically report/block without user confirmation.
- Show clear disclaimers: ScamShield provides safety guidance, not guaranteed threat detection.

## Non-goals
- No login system unless needed for history.
- No real-time browser extension.
- No paid APIs.
- No complex admin dashboard.
- No fake claims of 100% accuracy.