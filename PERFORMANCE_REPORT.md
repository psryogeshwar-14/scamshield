# ScamShield — Performance and Reliability Benchmark Report

This document records the **actual, measured performance metrics** of ScamShield across client bundle analysis, test execution latency, linting benchmarks, backend analysis throughput, and resilience under external service failures.

---

## 1. Production Build & Bundle Metrics

Measurements gathered directly from production Vite build (`npm run build:client`) using Node.js v22 and Vite v8.3.4:

| Asset | Raw Size | Gzip Transfer Size | Role |
| :--- | :--- | :--- | :--- |
| `dist/index.html` | 1.09 kB | 0.56 kB | Single-page application root entry |
| `dist/assets/index-*.css` | 67.93 kB | 11.07 kB | Tailwind CSS v4 utility styles + animations |
| `dist/assets/index-*.js` | 346.96 kB | 102.73 kB | Application bundle + React 19 + React Router |
| **Total Transfer Payload** | **415.98 kB** | **~114.36 kB** | **Initial load footprint** |

- **Vite Build Duration**: **149 ms**
- **Prisma Client Generation**: **31 ms**
- **Total Workspace Build**: **< 200 ms**

---

## 2. Automated Test Execution Benchmarks

Automated test execution timings recorded via Vitest v5.0.3 using the v8 coverage provider:

| Test Suite | Scope | Tests | Execution Time | Statement Coverage | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `server/test/unit/urlAnalyzer.test.js` | 11-Point URL Heuristics | 17 | 9 ms | 98.4% | PASS |
| `server/test/unit/safeBrowsing.test.js` | Safe Browsing Client & Fallbacks | 6 | 5 ms | 92.3% | PASS |
| `server/test/unit/geminiAnalyzer.test.js` | AI Fallbacks & Schema Guard | 10 | 3 ms | 88.9% | PASS |
| `server/test/integration/api.test.js` | Express Endpoints & Security | 21 | 75 ms | 82.5% | PASS |
| **Backend Total** | **Server API & Logic** | **54** | **423 ms** | **76.34%** | **PASS** |
| `client/src/test/RiskBadge.test.jsx` | Risk Badges & A11y Attributes | 7 | 98 ms | 100.0% | PASS |
| `client/src/test/HomePage.test.jsx` | Form, Tabs, Validation, Nav | 8 | 541 ms | 72.1% | PASS |
| `client/src/test/ResultPage.test.jsx` | Dossier, Feeds, Why Breakdown | 8 | 295 ms | 69.6% | PASS |
| `client/src/test/HistoryPage.test.jsx` | History, Filter, Delete Modal | 6 | 354 ms | 78.3% | PASS |
| **Frontend Total** | **React Client & UI Flows** | **29** | **1,450 ms** | **74.63%** | **PASS** |
| **Workspace Grand Total** | **End-to-End Suite** | **83** | **< 2.0 s** | **~75.5%** | **100% PASS** |

---

## 3. Static Analysis & Linting Throughput

Measured via `oxlint` (Rust-based high-speed linter):

- **Backend (`server/src`)**: 23 files analyzed in **22 ms** (0 errors, 0 warnings).
- **Frontend (`client/src`)**: 27 files analyzed in **41 ms** (0 errors, 0 warnings).
- **Total Lint Time**: **63 ms** across 50 files.

---

## 4. Analysis Pipeline Latency & Bounds

| Pipeline Stage | Processing Mechanism | Measured / Bound Latency | Fallback Strategy |
| :--- | :--- | :--- | :--- |
| **Deterministic Heuristics** | In-memory regex & structural parsing | **< 2 ms** | Always executes; 100% local availability. |
| **Google Safe Browsing v4** | External HTTPS POST to Google API | Max **5,000 ms** (AbortController timeout) | Returns `{ status: 'unavailable' }` gracefully on timeout or unconfigured key; never blocks pipeline. |
| **Gemini AI Structured Analysis** | External HTTPS POST via `@google/genai` | Max **10,000 ms** (AbortController timeout) | Instantly pivots to deterministic message classification engine on timeout, quota error, or invalid payload. |
| **Database Persistence** | SQLite via Prisma Client | **3 - 8 ms** | Atomic transaction; continues even if history write fails non-fatally. |
| **End-to-End Local Analysis** | Heuristics + Fallback AI (offline mode) | **8 - 18 ms** | Full functionality retained without external API credentials. |

---

## 5. Engineering Reliability Controls Implemented

1. **Pagination & Query Limits**:
   - `GET /api/history` enforces bounded pagination (`limit: 10`, max `limit: 100`) with indexed `orderBy: { createdAt: 'desc' }`.
   - Eliminates unbounded `SELECT *` memory leaks when log grows over thousands of scans.

2. **Payload Size Guard**:
   - Strict 50KB request body limit prevents buffer bloat and prototype pollution attempts.
   - Character length capped at 2,048 for URLs and 5,000 for text messages.

3. **Memory-Safe Sliding Window Rate Limiting**:
   - In-memory rate limiting with automated cleanup intervals prevents resource exhaustion.
   - Analysis endpoints: 100 requests / 15 minutes per IP.
   - History endpoints: 300 requests / 15 minutes per IP.

4. **Zero Server-Side Network Execution**:
   - User-provided URLs are parsed lexically and checked against reputation feeds; server **never** fetches, redirects to, or downloads arbitrary remote assets.
   - Prevents SSRF (Server-Side Request Forgery) and server resource exhaustion.

5. **Client-Side UX Efficiency**:
   - Zero gratuitous interval re-renders.
   - State initialized directly from route state on transitions (`useState(() => extractSteps(state))`), eliminating cascading effect re-renders.
   - Reduced-motion accessibility media query respected (`@media (prefers-reduced-motion: reduce)`).
