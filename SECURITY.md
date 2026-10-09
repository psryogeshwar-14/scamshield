# 🔒 Security Policy — ScamShield

## 1. Overview & Threat Model

ScamShield is an educational cybersecurity assistant designed for students and everyday users to inspect suspicious URLs and social engineering messages. Because ScamShield evaluates potentially malicious payloads, maintaining strict isolation, privacy, and defensive architecture is paramount.

### Assets Protected
1. **User Privacy & Payload Confidentiality**: Users paste sensitive messages (such as SMS notifications or emails). These payloads must never be stored with personally identifiable information (PII) or leaked in logs.
2. **Server Infrastructure & External Systems**: The backend must never execute, navigate to, or run scripts contained in user-provided links (Zero Server-Side Execution).
3. **API Keys & Threat Feeds**: Gemini API and Google Safe Browsing credentials must never be exposed to the client or leaked via client bundles.
4. **Data Integrity**: Analysis records and checklist progress stored in the SQLite database must be tamper-resistant and sanitized.

### Trust Boundaries
- **Untrusted Zone**: User browser client, user input forms, external networks, untrusted domains entered for inspection.
- **Trusted Boundary**: Express API server, Prisma ORM layer, SQLite database file.
- **External Third-Party APIs**: Google Gemini API (`@google/genai`) and Google Safe Browsing API v4 (`safebrowsing.googleapis.com`), communicated with via HTTPS and outbound timeouts.

---

## 2. Main Abuse Cases & Mitigations

| Abuse Scenario | Attack Vector | ScamShield Defensive Control |
|---|---|---|
| **Server-Side Request Forgery (SSRF)** | Attacker submits internal IP (`127.0.0.1`, `169.254.169.254`, or intranet host) to probe internal network. | **Zero Fetch Architecture**: ScamShield NEVER sends HTTP requests to user-submitted URLs. Link evaluation is strictly static/lexical analysis paired with cloud threat database lookups. |
| **Denial of Service (DoS)** | Attacker floods analysis endpoints with large payloads or rapid automated requests. | `express-rate-limit` enforces 100 checks / 15 min per IP on `/api/analyze` and 300 requests / 15 min on history routes; `express.json({ limit: '50kb' })` blocks oversized payloads. |
| **Credential Harvesting** | Imposter service collecting student passwords or banking PINs. | ScamShield explicitly rejects requests for passwords, OTPs, and credit card credentials. Prompt guidelines instruct Gemini never to solicit credentials. |
| **Cross-Site Scripting (XSS)** | Malicious payload with `<script>` tags entered into message or URL input. | React automatically escapes JSX expressions. Output is sanitized. Express utilizes `helmet` for Content Security Policy (`CSP`) and XSS protection headers. |
| **SQL Injection** | Attacker injects SQL payloads through search queries or record IDs. | All persistence queries use **Prisma ORM**, ensuring parameterized SQL queries under the hood. |
| **Data Leakage in Logs** | Sensitive student messages or phone numbers printed to terminal/cloud log streams. | `requestLogger.js` logs only string length counts, domain names, status codes, and request durations. Sensitive credentials (passwords, OTPs, auth headers) are pattern-redacted. |
| **False Sense of Security** | User assumes a new malicious domain is safe because no threat feed has flagged it yet. | Analysis explicitly returns `Safe Browsing: unavailable` when keys are unconfigured or fail. Disclaimers clearly state that absence of evidence is not proof of safety. |

---

## 3. Implemented Security Controls

- **HTTP Security Headers**: `helmet` enforces Content Security Policy (CSP), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict referrer policies.
- **Strict Input Constraints**:
  - URLs: strictly validated, maximum length 2,048 characters, control characters blocked.
  - Messages: maximum length 5,000 characters, null bytes rejected.
  - Parameters: validated with `express-validator` schema constraints.
- **Safe URL Normalization**: Pure parser using standard WHATWG `URL` API with protocol enforcement (`http:` and `https:` only).
- **Correlation & Request Tracing**: Every request is assigned an `X-Request-Id` UUID for auditability without exposing internal stack traces.
- **Sanitized Error Handling**: `errorHandler.js` returns clean, user-friendly messages with error codes and correlation IDs. Internal stack traces are suppressed in production.
- **Human Confirmation Gate**: Destructive actions (deleting historical dossiers or resetting checklist progress) require explicit human confirmation.

---

## 4. Known Limitations

1. **Zero-Day Phishing Domains**: Newly created phishing domains (registered within hours) may not yet appear on Google Safe Browsing threat lists. ScamShield compensates through its 11 structural heuristics and Gemini social-engineering models, but users must remain alert.
2. **Obfuscated Payloads**: Heavily encrypted or steganographic payloads cannot be detected via plain text inspection.
3. **No Dynamic Execution / Sandbox**: Because ScamShield is lightweight and privacy-preserving, it does not run headless browsers to inspect dynamic JavaScript cloaking.

---

## 5. Production Hardening Recommendations

For deploying ScamShield in enterprise or institutional university environments:
1. **Database Migration**: Switch from SQLite (`dev.db`) to PostgreSQL or Cloud SQL with managed backups and row-level encryption.
2. **Reverse Proxy & WAF**: Deploy behind Cloudflare, AWS CloudFront, or Nginx with AWS WAF / Cloudflare WAF enabled for DDoS mitigation.
3. **Secret Management**: Store `GEMINI_API_KEY` and `SAFEBROWSING_API_KEY` in Google Secret Manager, AWS Secrets Manager, or HashiCorp Vault.
4. **HTTPS Enforcement**: Terminate TLS at the load balancer with automatic HTTP to HTTPS redirects and HTTP Strict Transport Security (`HSTS`) with preloading.
5. **Auditing & SIEM**: Stream anonymized security event logs into an ELK stack or Google Cloud Logging with anomaly detection alerts.

---

## 6. Responsible Disclosure

If you discover a security vulnerability in ScamShield, please do not file a public GitHub issue. Instead, report it responsibly:

- **Security Contact**: `security@scamshield.local` (or create a private GitHub Security Advisory)
- **Response Timeline**: Acknowledgement within 48 hours; status updates every 5 business days until resolution.
