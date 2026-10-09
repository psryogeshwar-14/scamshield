# Code Quality Audit — ScamShield

**Audit Date**: October 9, 2026  
**Auditor**: Antigravity Autonomous Code Quality Assessor  
**Scope**: Full Stack Inspection (`server/` and `client/`)  
**Target Category**: Code Quality (Baseline: 89/100 $\to$ Target: 98–100/100)  
**Constraint**: Zero functional, security, efficiency, accessibility, or testing regressions.

---

## 1. Executive Summary & Baseline Metrics

ScamShield is a production-grade cybersecurity web application built with Express, Prisma (SQLite), and React (Vite). The baseline evaluation scores are:

| Evaluation Dimension | Current Score | Status |
| :--- | :--- | :--- |
| **Security** | **100 / 100** | Strict (Zero secrets, Helmet, CORS, Rate Limit, ReDoS-safe) |
| **Efficiency** | **100 / 100** | Fast (Vite bundle < 150ms, Prisma indexes, in-memory heuristics) |
| **Testing** | **96 / 100** | Comprehensive (144/144 tests passing: 94 server, 50 client) |
| **Accessibility** | **100 / 100** | WCAG 2.1 AA (0 axe-core violations) |
| **Problem Statement Alignment** | **100 / 100** | Direct match (threat analysis & actionable guidance) |
| **Code Quality** | **89 / 100** | **Primary Improvement Target** |
| **Overall Score** | **97.12 / 100** | High Performance Baseline |

While the application is robust, reliable, and secure, several structural code quality code smells prevent it from achieving a top-tier Code Quality score (98–100/100). This audit identifies each issue with concrete evidence from the repository.

---

## 2. Large Functions Audit

| File | Function | Line Count | Issue & Impact |
| :--- | :--- | :--- | :--- |
| [`server/src/services/geminiAnalyzer.js`](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/server/src/services/geminiAnalyzer.js#L158-L349) | `fallbackAnalyzeMessage` | **191 lines** | Single monster function containing 6 sequential keyword/signature matching blocks with deeply nested conditionals and inlined response structures. Hard to unit-test individual fraud detection patterns in isolation. |
| [`server/src/services/urlAnalyzer.js`](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/server/src/services/urlAnalyzer.js#L251-L424) | `runHeuristicChecks` | **173 lines** | Monolithic heuristic scoring engine. Evaluates 11 separate checks sequentially, directly mutating a score variable and pushing findings with inline copy. Difficult to test individual heuristics independently. |
| [`server/src/services/analysisService.js`](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/server/src/services/analysisService.js#L51-L168) | `analyzeUrlTarget` | **117 lines** | Orchestrates heuristic checks, safe browsing lookup, Gemini API call, risk reconciliation, `whyThisResult` breakdown assembly, Prisma database persistence, and massive 50-field output formatting. |
| [`server/src/services/geminiAnalyzer.js`](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/server/src/services/geminiAnalyzer.js#L354-L420) | `fallbackAnalyzeUrl` | **66 lines** | Multi-branch URL fallback synthesizer with inlined copy and disparate confidence calculations. |
| [`server/src/services/geminiAnalyzer.js`](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/server/src/services/geminiAnalyzer.js#L426-L476) | `analyzeMessageWithGemini` | **50 lines** | SDK initialization, prompt string template formatting, timeout race creation, API call, JSON parsing, error catching, and fallback mapping all mixed in one block. |
| [`server/src/services/geminiAnalyzer.js`](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/server/src/services/geminiAnalyzer.js#L482-L540) | `analyzeUrlWithGemini` | **58 lines** | Same as above with prompt JSON stringification mixed in. |
| [`client/src/pages/ResultPage.jsx`](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/client/src/pages/ResultPage.jsx) | `ResultPage` component | **678 lines** | Component manages router params, API data fetching, optimistic state mutations, clipboard actions, JSON exports, tab state, chart simulations, and accordion view rendering in a single file. |

---

## 3. Duplicated Code Audit

1. **Async Timeout Race Logic**:
   - [`geminiAnalyzer.js` Lines 457–467](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/server/src/services/geminiAnalyzer.js#L457-L467) and [Lines 521–531](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/server/src/services/geminiAnalyzer.js#L521-L531) contain duplicate `Promise.race([apiPromise, timeoutPromise])` setup with manual `setTimeout` and `clearTimeout`.
   - *Remedy*: Extract a reusable, generic `withTimeout(promise, ms, label)` utility.

2. **Recommendation Step Transformation**:
   - `(aiAnalysis.safetySteps || []).map((action) => ({ action, completed: false }))` is duplicated across [`analysisService.js`](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/server/src/services/analysisService.js#L32) and fallback mapping [Line 126](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/server/src/services/analysisService.js#L126).
   - In frontend, step extraction from either `safetyRecommendations` or `safetyStepsJson` is duplicated between [`ResultPage.jsx` Lines 19–36](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/client/src/pages/ResultPage.jsx#L19-L36) and [`SafetyActionsPage.jsx` Lines 30–47](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/client/src/pages/SafetyActionsPage.jsx#L30-L47).
   - *Remedy*: Create pure helper `extractSafetySteps(record)` on client and server.

3. **Optimistic Recommendation Toggling**:
   - Both [`ResultPage.jsx` Lines 90–110](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/client/src/pages/ResultPage.jsx#L90-L110) and [`SafetyActionsPage.jsx` Lines 61–85](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/client/src/pages/SafetyActionsPage.jsx#L61-L85) duplicate the optimistic UI state update, persistence condition check, API call, and rollback logic on error.
   - *Remedy*: Extract `useRecommendationToggle` hook or shared state utility.

---

## 4. Mixed Responsibilities & Architectural Boundaries

Current architecture violates the Single Responsibility Principle across several layers:

```
[Current Server Architecture]
Routes (analyze.js, history.js)
  ↓
Controllers (analyzeController.js, historyController.js)
  ↓
Services (analysisService.js, historyService.js) ───[DIRECT PRISMA CALLS]───→ Database
  ↓
External Clients mixed with Business Logic (geminiAnalyzer.js, safeBrowsing.js)
```

### Key Boundary Violations Identified:
1. **Missing Repository Layer**:
   - `analysisService.js` contains `persistThreatCheck` which executes raw Prisma queries (`prisma.threatCheck.create`).
   - `historyService.js` directly calls `prisma.threatCheck.count`, `prisma.threatCheck.findMany`, `prisma.threatCheck.findUnique`, `prisma.threatCheck.delete`, and `prisma.safetyRecommendation.update`.
   - Business services should never depend directly on the database client; they should depend on clean repository abstractions.
2. **Missing Integrations Layer**:
   - External clients (`@google/genai` SDK and Google Safe Browsing REST `fetch`) are bundled directly inside `services/geminiAnalyzer.js` and `services/safeBrowsing.js`, mixed with prompt formatting, timeout racing, fallback rule evaluation, and sanitization logic.
3. **Missing Canonical Analysis Pipeline**:
   - `analyzeUrlTarget` and `analyzeMessageTarget` follow disparate code paths and construct disjointed result objects rather than running through a unified, stage-by-stage pipeline.

---

## 5. Missing Validation Boundaries & Data Contracts

1. **Ad-Hoc Object Literals**:
   - Domain results (`heuristics`, `safeBrowsing`, `aiAnalysis`, `finalReport`) are instantiated as ad-hoc JavaScript object literals without formal type/schema definitions or structural validators.
2. **Inconsistent Error Contracts**:
   - `errorHandler.js` outputs `{ success: false, error: { message, code, requestId } }`.
   - `validateRequest.js` outputs `{ success: false, error: { message, code, requestId, details } }`.
   - While functional, there is no centralized, strongly-typed error schema defining domain error codes.

---

## 6. Magic Strings & Magic Numbers Audit

| Location | Magic Values | Issue |
| :--- | :--- | :--- |
| [`urlAnalyzer.js`](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/server/src/services/urlAnalyzer.js#L274-L407) | `20, 35, 25, 20, 12, 10, 15, 40, 25, 10, 15` (weights)<br>`60, 30` (risk thresholds) | Hardcoded numeric weights scattered across 11 heuristic rules. Modifying scoring or risk thresholds requires editing code across 150 lines. |
| Throughout `server/src/` | `'safe'`, `'suspicious'`, `'high_risk'` | String literals repeated across routes, controllers, services, and tests without a central enum constant. |
| Throughout `server/src/` | `'phishing'`, `'otp_scam'`, `'payment_scam'`, `'fake_job'`, `'malware'`, `'impersonation'`, `'account_takeover'`, `'social_engineering'`, `'unknown'` | String literals repeated across files without a central enum constant. |
| [`historyService.js`](file:///Users/psryogeshwar/Documents/Documents/Project/scamshield/server/src/services/historyService.js#L8-L9) | `20, 100` | Default pagination constants hardcoded in function parameters. |

---

## 7. Refactoring Strategy (High Impact, Low Risk)

To bring Code Quality from 89/100 to 98–100/100 without breaking any of the 144 passing tests or altering visual UI:

```
[Proposed Clean Backend Architecture]
┌────────────────────────────────────────────────────────┐
│                      routes/                           │ (HTTP route mapping)
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│                    controllers/                        │ (HTTP request/response mapping)
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│                      services/                         │ (Core business logic & pipeline orchestration)
│  ┌──────────────────────────────────────────────────┐  │
│  │              analysisPipeline.js                 │  │ (Canonical 9-stage analysis pipeline)
│  └──────────────────────────────────────────────────┘  │
└───────┬───────────────────────────────┬────────────────┘
        ▼                               ▼
┌────────────────────────┐    ┌────────────────────────┐
│     integrations/      │    │     repositories/      │
│  • geminiClient.js     │    │  • threatCheckRepo.js  │
│  • safeBrowsingClient  │    │  • recommendationRepo  │
└────────────────────────┘    └──────────┬─────────────┘
                                         ▼
                              ┌────────────────────────┐
                              │     Prisma Client      │
                              └────────────────────────┘
```

### Module Breakdown:
1. **Domain Constants (`server/src/constants/threatTypes.js`)**:
   - `RISK_LEVELS` (`SAFE`, `SUSPICIOUS`, `HIGH_RISK`)
   - `THREAT_TYPES` (All 9 official categories)
   - `HEURISTIC_WEIGHTS` & `RISK_THRESHOLDS`
   - `ERROR_CODES`
2. **Repositories (`server/src/repositories/`)**:
   - `threatCheckRepository.js`: Encapsulates all `prisma.threatCheck` operations (`create`, `findById`, `findManyWithPagination`, `deleteById`).
   - `recommendationRepository.js`: Encapsulates all `prisma.safetyRecommendation` operations (`updateStatus`, `findByThreatCheckId`).
3. **Pure Domain Engines (`server/src/domain/`)**:
   - `urlNormalization.js`: Pure URL normalization and host decomposition.
   - `urlHeuristicsEngine.js`: Individual, modular heuristic rule evaluators.
   - `messageSignalEngine.js`: Pure message fraud pattern and signature matching.
   - `riskReconciler.js`: Pure risk level reconciliation between Heuristics, Safe Browsing, and Gemini.
   - `recommendationGenerator.js`: Pure generation of actionable safety checklists.
4. **Canonical Analysis Pipeline (`server/src/services/analysisPipeline.js`)**:
   - Orchestrates the 9 stages:
     1. Input Validation
     2. Normalization
     3. Deterministic Heuristic/Signal Analysis
     4. Safe Browsing Lookup
     5. Gemini Interpretation
     6. Response Schema Validation & Sanitization
     7. Final Risk Reconciliation
     8. Persistence via Repository
     9. API Response Assembly
5. **Standardized API Error Factory (`server/src/utils/apiError.js`)**:
   - Produces `{ success: false, error: { code, message, requestId, details } }` conforming strictly to Requirement 5 while maintaining 100% test compatibility.
6. **Frontend State Refactoring**:
   - Centralize recommendation status toggle and step extraction into reusable helpers.
   - Keep all visual styles, accessible markup, and test selectors 100% identical.

---

## 8. Audit Approval & Sign-Off

- **Audit Completion**: All 14 points inspected and documented.
- **Next Step**: Execute implementation following clean separation of concerns without introducing any regression.
- **Verification Plan**: Lint $\to$ 144 Vitest tests $\to$ Coverage $\to$ Production Vite Build $\to$ Prisma Generation $\to$ Security Audit.
