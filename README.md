# 🛡️ ScamShield — Intelligent Cybersecurity Threat Analyzer & Defense Assistant

> **Hackathon Challenge**: *"Build an intelligent system that identifies or analyzes cybersecurity threats and provides actionable security recommendations."*  
> **ScamShield's Solution**: An intelligent, multi-layered threat evaluation radar that identifies malicious URLs and social-engineering messages in real time, explains technical threat evidence in plain language, and provides interactive, step-by-step security recommendations.  
> *Developed for PromptWars X Error Zero Hackathon • Track: AI-Powered Cybersecurity & Digital Safety*

---

## ⚡ 30-Second Evaluator Demo Track

Evaluate the complete threat identification and recommendation pipeline in under 30 seconds:

```bash
# 1. Start application locally
npm run dev
# Frontend: http://localhost:5173  |  Backend API: http://localhost:3001
```

1. **Open** `http://localhost:5173` in your browser.
2. **Click** any preset under **"One-Click Evaluation Scenarios"**:
   - `PayPal Phishing Domain` (URL Threat)
   - `Urgent Bank Block Threat` (Message / OTP Threat)
3. **Click** `"Launch Threat Analysis"`.
4. **Observe the 3 Core Capabilities in Real Time**:
   - 🎯 **Cybersecurity Threat Identified**: Visual Risk Severity (`Critical Hazard`), Classification (`Phishing / Impersonation`), and Calibrated Risk Score (`85/100`).
   - 💡 **Evidence Explained in Plain Language**: Transparent 4-pillar breakdown (`Deterministic Heuristics`, `Google Safe Browsing v4 Feed`, `Gemini AI Intent Reasoning`, and `Confidence Limitations`).
   - 🛡️ **Actionable Security Recommendations**: High-priority **Immediate Directive** banner + **Interactive Safety Checklist** with toggleable checkboxes and persistent progress tracking.

---

## 1. Problem Statement Alignment

ScamShield addresses the exact challenge prompt:  
**"Build an intelligent system that identifies or analyzes cybersecurity threats and provides actionable security recommendations."**

Today's digital citizens, particularly students and young professionals, face sophisticated social engineering that exposes three critical industry gaps:

1. **The Detection Gap**: Traditional antiviruses and DNS filters rely on retroactive cataloging. They miss newly minted zero-day phishing domains and non-URL messaging fraud (SMS urgency extortion, OTP harvesting, advance-fee Telegram traps).
2. **The Communication Gap**: Existing security tools output cryptic jargon (*"Shannon entropy 4.2"*, *"Punycode xn-- spoof"* or raw HTTP codes). Users cannot understand the nature of the hazard.
3. **The Actionability Gap**: Most security products stop at a passive warning badge (*"Malicious - Proceed at your own risk"*), leaving panicked victims with no guidance on how to secure their accounts.

---

## 2. Solution Statement

**ScamShield** bridges deterministic structural heuristics, live reputation intelligence, and generative AI reasoning into a coherent, resilient cyber defense assistant:

1. **Multi-Vector Threat Analysis**:
   - **URL Analysis Pipeline**: Analyzes 11 structural features (<2ms) including IP-based hosts, punycode lookalikes, URL shorteners, excessive subdomains, suspicious TLDs, and protocol downgrades.
   - **Reputation Intelligence**: Cross-references the Google Safe Browsing Lookup v4 API, gracefully reporting `"unavailable"` when unconfigured or offline rather than assuming safety.
   - **Message Analysis Pipeline**: Evaluates urgency manipulation, OTP theft patterns, reverse QR code / UPI traps, advance-fee employment fraud, and executable sideloads.
2. **Plain-Language Evidence Explanation**:
   - Translates raw metrics into everyday concepts through a dedicated **Plain-Language Explanation** card and a transparent **"Why This Result?"** 4-pillar evidence breakdown.
3. **Actionable Security Recommendations**:
   - Delivers a single, unequivocal **Recommended Immediate Directive** to prevent immediate harm.
   - Generates an **Interactive Defensive Checklist** with checkable steps saved to SQLite via Prisma for continuous threat remediation.
   - Provides a one-click **Shareable Advisory** for campus group alerts and direct escalation to the **National Cyber Crime Helpline (1930)**.
4. **Guaranteed Offline Resilience**:
   - If external APIs (Gemini or Safe Browsing) are offline, rate-limited, or unconfigured, ScamShield’s deterministic fallback engine activates automatically, guaranteeing zero downtime or blind spots.

---

## 3. Core Feature Matrix

| Capability Category | Feature | Problem Statement Function |
| :--- | :--- | :--- |
| **Threat Identification** | 11-Point Structural Heuristics | Real-time lexical analysis of IP hosts, brand spoofing, TLD abuse, and URL shorteners. |
| **Threat Intelligence** | Google Safe Browsing v4 | Live reputation feed cross-referencing known malware, deceptive sites, and exploit kits. |
| **Intelligent Reasoning** | Gemini 2.5 Flash Structured Analysis | Strict JSON schema extraction of threat category, confidence score, and observable indicators. |
| **Evidence Explanation** | Plain-Language Summary & Why Card | Demystifies technical findings across heuristics, reputation status, and intent analysis. |
| **Actionable Recommendations** | Immediate Directive Callout | High-contrast emergency instruction preventing immediate credential or financial surrender. |
| **Actionable Recommendations** | Interactive Safety Checklist | Step-by-step mitigation plan with checkable actions and persistent database progress tracking. |
| **Collaborative Defense** | One-Click Share Advisory | Preformatted warning text ready to alert peer circles on WhatsApp, Telegram, or Slack. |
| **Proactive Training** | Student Threat Simulator | Interactive "Spot The Scam" training module with real-world scenarios and defense playbooks. |
| **Privacy & Hardening** | Zero-Execution Privacy Shield | User URLs are never fetched or executed on the server; zero credential logging. |

---

## 4. Screenshots & Visual Walkthrough

Real screenshots captured directly from ScamShield:

| Home Security Radar | Threat Evaluation Verdict |
| :--- :---: | :---: |
| ![Home Scanner](docs/screenshots/01_home_analyzer.png) | ![Verdict Dossier](docs/screenshots/02_url_analysis_result.png) |
| *Input scanner with sample chips & mode tabs* | *Radial gauge, risk badges, and plain-language explanation* |

| Scam Message Analysis | Interactive Safety Checklist |
| :---: | :---: |
| ![Message Result](docs/screenshots/03_scam_message_result.png) | ![Safety Actions](docs/screenshots/04_safety_actions_checklist.png) |
| *SMS / OTP phishing detection & urgency scoring* | *Step-by-step mitigation tracking & progress meter* |

| Telemetry & History Dashboard |
| :---: |
| ![History Log](docs/screenshots/05_history_dashboard.png) |
| *Paginated log with threat distribution metrics and deletion controls* |

---

## 5. Deployment Guide & Live Links

- **Vercel Account**: [https://vercel.com/yogeshwar1](https://vercel.com/yogeshwar1)
- **Zero-Bug Vercel Configuration**: Pre-configured full-stack deployment via root [`vercel.json`](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/vercel.json) and serverless entrypoint [`api/index.js`](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/api/index.js).
- **Fast Deploy Steps**:
  1. Push repository to GitHub.
  2. Visit [Vercel New Project](https://vercel.com/new) under team `yogeshwar1`.
  3. Import the repository (Vercel automatically detects `vercel.json`).
  4. Configure environment variables (`GEMINI_API_KEY`, optional `SAFEBROWSING_API_KEY`, `NODE_ENV=production`).
  5. Click **Deploy**. The Vite client and Express serverless functions deploy concurrently.
- **CLI Deployment Option**:
  ```bash
  npx vercel login
  npx vercel --prod
  ```

---

## 7. Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 19 + Vite + Tailwind CSS)"]
        UI["Scanner Form & Target Tabs"]
        Dossier["Security Verdict & Radial Gauge"]
        WhyCard["Why This Result? Multi-Pillar Card"]
        Checklist["Interactive Mitigation Checklist"]
        History["Searchable Audit Log"]
    end

    subgraph SecurityBoundary["Backend Trust Boundary (Express 4)"]
        Helmet["Helmet Security Headers"]
        Cors["CORS Origin Filter"]
        RateLimit["Rate Limiter (Sliding Window)"]
        BodyLimit["50KB Body Parser & Input Validator"]
        
        subgraph Pipeline["Multi-Layer Analysis Pipeline"]
            Heuristics["11-Point URL Heuristics (Local, <2ms)"]
            SafeBrowsing["Google Safe Browsing v4 (5s Timeout)"]
            Gemini["Gemini 2.5 Flash Structured Output (10s Timeout)"]
            Fallback["Deterministic Fallback Engine (Offline)"]
        end
        
        ErrHandler["Central Error Handler (Safe Error Correlation IDs)"]
    end

    subgraph Storage["Persistence Layer"]
        Prisma["Prisma ORM 5.22"]
        SQLite[(SQLite Database: ThreatCheck + Recommendations)]
    end

    UI -->|POST /api/analyze/*| Helmet
    Helmet --> Cors --> RateLimit --> BodyLimit --> Pipeline
    Pipeline --> Prisma --> SQLite
    Pipeline -->|Normalized Verdict| Dossier
    Dossier --> WhyCard
    Dossier --> Checklist
    History -->|GET /api/history| Pipeline
    Pipeline -.->|Failures| ErrHandler
```

---

## 8. User Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Student / User
    participant Web as Web Client
    participant API as ScamShield Backend
    participant Heur as Heuristics Engine
    participant GSB as Google Safe Browsing
    participant AI as Gemini AI Service
    participant DB as SQLite / Prisma

    User->>Web: Paste suspicious link or SMS message
    Web->>API: POST /api/analyze/url or /api/analyze/message
    API->>API: Enforce rate limits, length bounds, and sanitization
    API->>Heur: Run 11 deterministic checks (<2ms)
    par Threat Intelligence & AI Reasoning
        API->>GSB: Lookup URL against reputation blacklist (5s timeout)
        API->>AI: Evaluate intent, urgency, and hazard profile (10s timeout)
    end
    Note over API: If Safe Browsing or Gemini fails/unconfigured,<br/>activate deterministic fallback engine
    API->>DB: Persist threat dossier and safety action steps
    API-->>Web: Return normalized verdict with Why breakdown
    Web-->>User: Render Risk Badge, Explanation, and Safety Checklist
    User->>Web: Complete mitigation steps and toggle actions
    Web->>API: PATCH /api/history/:id/recommendations/:stepId
    API->>DB: Update action status
```

---

## 9. 4-Stage Threat-Analysis Pipeline

ScamShield evaluates incoming targets through four sequential stages:

```
[Target Input: URL / Message]
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 1: URL Heuristics (Local 11-Point Structural Engine)  │
│ • Local execution (<2ms); server NEVER fetches remote URLs  │
│ • Evaluates IP hosts, shorteners, suspicious TLDs, punycode │
│ • Brand impersonation, subdomain depth, protocol downgrade  │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 2: Google Safe Browsing Reputation Check (Lookup v4)  │
│ • Official endpoint: /v4/threatMatches:find                 │
│ • 5,000ms AbortController timeout guard                     │
│ • Strict 3-state resolution: 'threat' | 'clean' | 'unavail' │
│ • Never claims 'safe' when service is unavailable           │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 3: Gemini Explanation and Classification              │
│ • Official @google/genai SDK with gemini-2.5-flash          │
│ • Strict JSON schema output (SCAM_SHIELD_RESPONSE_SCHEMA)   │
│ • Factual prompt grounding (temperature: 0.1, no hallucination)│
│ • 10,000ms timeout guard + deterministic offline fallback   │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ STAGE 4: Validated Safety Recommendations                   │
│ • Deterministic risk reconciliation (prevents false safe)   │
│ • High-priority Recommended Immediate Directive             │
│ • Interactive Safety Checklist (persisted via Prisma SQLite)│
│ • Why This Result? 4-Pillar Breakdown & Shareable Advisory  │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, React Router v7.
- **Backend**: Node.js (ESM), Express 4, Helmet, CORS, Express Rate Limit.
- **Database**: Prisma ORM 5.22, SQLite.
- **AI & Threat Intelligence**: Google Gemini 2.5 Flash (`@google/genai`), Google Safe Browsing Lookup API v4.
- **Static Analysis & Testing**: Vitest 5, `@testing-library/react`, `@vitest/coverage-v8`, jsdom, Supertest, oxlint.

---

## 11. Folder Structure

```
scamshield/
├── client/                     # Frontend Single Page Application
│   ├── src/
│   │   ├── api/client.js       # Centralized API service client
│   │   ├── components/         # Button, Card, RiskBadge, LoadingSpinner, etc.
│   │   ├── context/            # ToastProvider, ToastContext
│   │   ├── hooks/useToast.js   # Notification toast hook
│   │   ├── pages/              # HomePage, ResultPage, HistoryPage, AboutPage, NotFoundPage
│   │   └── test/               # React Testing Library unit & component tests
│   ├── package.json
│   ├── vite.config.js
│   └── vitest.config.js
├── server/                     # Backend API Server
│   ├── prisma/
│   │   ├── schema.prisma       # Database models (ThreatCheck, SafetyRecommendation)
│   │   └── migrations/         # Applied SQLite migrations
│   ├── src/
│   │   ├── config/index.js     # Validated environment configuration
│   │   ├── controllers/        # Thin route controllers (analyze, history, health)
│   │   ├── middleware/         # errorHandler, rateLimiter, requestId, validateRequest
│   │   ├── routes/             # analyzeRoutes, historyRoutes, healthRoutes
│   │   ├── services/           # analysisService, urlAnalyzer, geminiAnalyzer, safeBrowsing
│   │   ├── utils/              # logger (with redaction), prismaClient
│   │   ├── validators/         # Request schema validators
│   │   ├── app.js              # Express app definition
│   │   └── index.js            # Server entrypoint with graceful shutdown
│   ├── test/                   # Vitest unit and integration tests
│   └── package.json
├── docs/screenshots/           # Real project screenshots
├── .env.example                # Safe environment template
├── .gitignore                  # Git ignore rules
├── package.json                # Root workspace orchestration
├── AUDIT_REPORT.md             # Baseline repository audit
├── SECURITY.md                 # Security policy & threat model
├── SECURITY_TEST_REPORT.md     # Security test verification report
└── PERFORMANCE_REPORT.md       # Measured latency & bundle benchmarks
```

---

## 12. Local Installation

```bash
# 1. Clone repository
git clone https://github.com/your-username/scamshield.git
cd scamshield

# 2. Run one-command workspace setup (installs client, server, and generates Prisma client)
npm run setup
```

---

## 13. Environment Variables

Copy the template to `server/.env`:

```bash
cp .env.example server/.env
```

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `3001` | Backend HTTP port |
| `NODE_ENV` | Optional | `development` | Runtime environment (`development` / `production` / `test`) |
| `CLIENT_URL` | Optional | `http://localhost:5173` | Allowed CORS frontend origin |
| `DATABASE_URL` | Yes | `file:./prisma/dev.db` | SQLite database connection string |
| `GEMINI_API_KEY` | Optional | *(empty)* | Google Gemini API key (enables AI analysis; fallback used if absent) |
| `SAFEBROWSING_API_KEY` | Optional | *(empty)* | Google Safe Browsing API key (feed returns `unavailable` if absent) |

> 💡 **Offline Mode**: ScamShield operates fully even without API keys using deterministic heuristics and offline fallback classification.

---

## 14. Database Setup

```bash
# Generate Prisma client
npm --prefix server run prisma:generate

# Apply database migrations (deploy to SQLite)
npm --prefix server run prisma:deploy

# Or to run dev migrations interactively:
# npm --prefix server run prisma:migrate
```

---

## 15. Development Commands

```bash
# Start backend and frontend concurrently
npm run dev

# Or run services individually:
npm run dev:server   # Express API on http://localhost:3001
npm run dev:client   # Vite frontend on http://localhost:5173
```

---

## 16. Testing Commands

```bash
# Run the complete test suite (83 automated tests)
npm test

# Run tests with code coverage reports
npm run test:coverage

# Run static analysis and linting across the workspace
npm run lint

# Build production artifacts
npm run build
```

---

## 17. API Documentation

### `POST /api/analyze/url`
Inspects a URL using heuristics, Safe Browsing, and Gemini AI.

**Request Body**:
```json
{
  "url": "http://secure-paypal-verify.login-update.xyz"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "cm2...",
    "inputType": "url",
    "riskLevel": "high_risk",
    "threatType": "Phishing",
    "confidence": 0.94,
    "summary": "Deceptive URL attempting to harvest credentials.",
    "recommendedAction": "Do not enter login credentials. Close the tab immediately.",
    "heuristics": {
      "score": 85,
      "findings": [
        { "id": "tld", "label": "Suspicious TLD", "detail": ".xyz domain" },
        { "id": "brand_keyword", "label": "Brand Impersonation", "detail": "Contains paypal" }
      ]
    },
    "safeBrowsing": { "status": "unavailable", "details": "Unconfigured or offline" },
    "safetyRecommendations": [
      { "id": "rec-1", "action": "Do not enter passwords", "completed": false }
    ],
    "whyThisResult": {
      "deterministicChecks": "3 heuristic rules triggered",
      "externalReputation": "Unavailable",
      "aiInterpretation": "Phishing mimicry pattern recognized",
      "limitations": "Heuristics cannot guarantee zero-day safety"
    }
  }
}
```

### `POST /api/analyze/message`
Inspects SMS, email, or chat messages for social engineering.

**Request Body**:
```json
{
  "message": "Your university LMS account expires in 15 mins. Send OTP to 99999 to verify."
}
```

### `GET /api/history?page=1&limit=10&type=all`
Retrieves paginated scan history. `type` can be `all`, `url`, `message`, or `high_risk`.

### `GET /api/history/:id`
Retrieves a single inspection record by ID.

### `PATCH /api/history/:id/recommendations/:stepId`
Updates the completion status of a safety recommendation step.

### `DELETE /api/history/:id`
Deletes a scan record and its associated recommendation steps.

### `GET /api/health`
Health check endpoint reporting database connectivity and service availability.

---

## 18. Security & Privacy

See [SECURITY.md](SECURITY.md) for full details:
- **No Remote Fetching**: Server parses URLs lexically and never visits, executes, or fetches remote content.
- **Log Masking**: Input text is redacted with hash fingerprints in server logs.
- **Strict Headers**: Helmet applies CSP, HSTS, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`.
- **Sliding-Window Rate Limiting**: Mitigates automated denial-of-service and brute-force abuse.
- **Prisma SQL Parameterization**: Eliminates SQL injection vulnerabilities.

---

## 19. Limitations

- **Guidance, Not a Guarantee**: Absence of a threat flag does not guarantee complete safety. Attackers continually register novel zero-day domains.
- **Private Intranet Domains**: ScamShield cannot verify internal enterprise/campus private networks (`10.0.0.0/8`, `192.168.0.0/16`).
- **Encrypted Content**: ScamShield evaluates message text submitted by the user and cannot inspect encrypted files or password-protected archives.

---

## 20. Future Roadmap

- [ ] Browser extension for automatic URL inspection during active browsing.
- [ ] OCR screenshot analysis for inspecting suspicious MMS and mobile app screenshots.
- [ ] Crowdsourced threat community reporting with honeypot verification.
- [ ] Real-time university alert feeds for campus IT administrators.

---

## 21. Contributing

We welcome contributions! Please review [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before submitting pull requests.

---

## 22. License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 23. Credits & Acknowledgments

- **Google Gemini API** for structured JSON output models.
- **Google Safe Browsing** for cloud reputation feeds.
- **PromptWars X Error Zero Hackathon** organizing committee and mentors.
- **Tailwind CSS & Vite** teams for frontend tooling.
