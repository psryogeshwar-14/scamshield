# 🛡️ ScamShield — Live Demo Script & Playbook

> **High-Impact 90-Second Hackathon Presentation & Live Demo Guide**  
> *Track: AI-Powered Cybersecurity & Digital Safety • PromptWars X Error Zero*

---

## 1. Demo Inputs & Expected Results

### Scenario A: PayPal Credential Harvesting Domain (High Risk Phishing)
- **Input URL**: `http://secure-paypal-verify.login-update.xyz`
- **Click**: Click the `"PayPal Phishing Domain"` sample chip on the home screen.
- **Expected Results**:
  - **Risk Verdict**: `High Risk` (Crimson hazard styling with `✕` icon).
  - **Risk Score**: `85 / 100` on the animated radial threat gauge.
  - **Google Safe Browsing**: Displays `Reputation Feed Unavailable` (or `Active Threat Flagged` if key provisioned) in amber/rose.
  - **Why This Result?**:
    - *Deterministic Checks*: Triggers Unencrypted HTTP, `.xyz` high-abuse TLD, and PayPal brand impersonation.
    - *AI Intent*: Explains that the domain attempts credential mimicry under an untrusted TLD.
    - *Limitations*: Clearly warns that automated triage is advisory.
  - **Interactive Safety Checklist**:
    1. Do not enter login credentials or passwords.
    2. Close the tab immediately.
    3. Check your authentic PayPal account independently at paypal.com.

### Scenario B: Urgent Student Account Suspension SMS (Urgent Social Engineering)
- **Input Message**: `Your university LMS student account expires in 15 minutes. To avoid exam disqualification, send your 6-digit OTP to 9876543210 immediately.`
- **Click**: Switch to `"Inspect Message or Email"` tab and paste text.
- **Expected Results**:
  - **Risk Verdict**: `High Risk` (`OTP Scam & Credential Harvesting`).
  - **Risk Score**: `90 / 100`.
  - **Why This Result?**:
    - Identifies artificial 15-minute deadline urgency coercion.
    - Identifies credential harvesting trap (demanding 6-digit OTP).
  - **Interactive Safety Checklist**:
    1. Never share one-time passwords (OTPs) with anyone.
    2. Forward the phone number to campus IT security.
    3. Verify account status by logging into the official portal directly.

### Scenario C: Legitimate Google Search Portal (Safe Verification)
- **Input URL**: `https://www.google.com`
- **Expected Results**:
  - **Risk Verdict**: `Safe` (Emerald styling with `✓` icon).
  - **Risk Score**: `< 15 / 100`.
  - **Why This Result?**: Zero heuristic red flags, legitimate HTTPS encryption, official brand domain.

---

## 2. 90-Second Live Presentation Script

| Timestamp | Screen / Visual Action | Spoken Script |
| :--- | :--- | :--- |
| **00:00 - 00:15** | Open **ScamShield Home Scanner** | *"Judges, every single day, students receive urgent messages claiming their university portal is expiring, or a link asking them to verify a payment. Most students aren't cybersecurity analysts — they can't decompile a URL or spot punycode homoglyphs. That is why we built ScamShield."* |
| **00:15 - 00:35** | Click **"PayPal Phishing Domain"** sample chip → Click **"Launch Threat Analysis"** | *"Watch what happens when a student pastes a suspicious link. In under 2 seconds, ScamShield’s hybrid engine kicks in: our 11-point deterministic heuristics evaluate the domain structure, query threat intelligence feeds, and feed the structural signals into Gemini 2.5 Flash."* |
| **00:35 - 00:55** | Arrive on **Result Page**; highlight **Why This Result?** | *"Instead of giving a mysterious black-box number, ScamShield gives transparency: our 'Why This Result?' section breaks down the exact heuristic flags — unencrypted HTTP, suspicious .xyz TLD, and brand impersonation — alongside plain-language AI reasoning."* |
| **00:55 - 01:15** | Click checkboxes on **Interactive Safety Checklist** | *"Crucially, detection is only half the battle. ScamShield gives users an interactive mitigation checklist: 'Do not enter passwords', 'Close tab', 'Verify independently'. As the student takes action, progress updates and syncs directly to their private audit log."* |
| **01:15 - 01:30** | Switch to **History Log** & conclude | *"Behind the scenes, we enforce strict zero-server-fetch security — our server never visits user URLs, inputs are redacted in logs, and we have 144 passing automated tests with 0 accessibility violations. ScamShield turns fear into actionable defense."* |

---

## 3. Resilience & Offline Fallback Plan (If External APIs Fail)

If the Wi-Fi drops or external Google APIs experience rate limits during a live pitch:

1. **Deterministic Offline Fallbacks**:
   - The backend includes a complete deterministic classification engine.
   - If `GEMINI_API_KEY` or `SAFEBROWSING_API_KEY` fail, times out (5s/10s `AbortController`), or has no internet connection, the pipeline **automatically falls back** to local heuristic and regex categorization in under 20ms.
2. **Safe Browsing Fallback**:
   - The UI displays `"Reputation Feed Unavailable"` in amber instead of crashing or showing a false clean status.
3. **Local SQLite Persistence**:
   - Works 100% locally on `localhost:3001` and `localhost:5173` without any remote database dependencies.
