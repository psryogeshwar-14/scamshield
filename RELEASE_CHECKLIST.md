# ScamShield Release & Deployment Verification Checklist

This checklist must be executed prior to tagging and publishing any production release of ScamShield.

---

## 1. Pre-Release Verification

- [ ] **Working Tree Status**: `git status` is clean with no untracked secrets, uncommitted edits, or temporary scratch files.
- [ ] **Git Ignore Rules**: Verify `.env`, `*.db`, `*.db-journal`, `coverage/`, and `dist/` are safely excluded.
- [ ] **Dependency Audit**: Run `npm audit --audit-level=high` (0 vulnerabilities allowed).
- [ ] **Static Analysis**: Run `npm run lint` (0 errors and 0 warnings across server and client).
- [ ] **Automated Tests**: Run `npm test` (all 83 automated tests must pass).
- [ ] **Coverage Verification**: Run `npm run test:coverage` (minimum 70% branch and statement coverage).
- [ ] **Production Build**: Run `npm run build` (client bundle and Prisma client compile successfully).

---

## 2. Environment & Configuration Check

- [ ] `.env.example` has placeholder documentation for all required and optional environment variables.
- [ ] `NODE_ENV` is set to `production` in deployment environments.
- [ ] `CLIENT_URL` explicitly points to the production frontend domain (e.g. `https://scamshield.example.com`).
- [ ] `DATABASE_URL` is configured and accessible.
- [ ] If `GEMINI_API_KEY` is provisioned, test that live API responses adhere to strict JSON schema.
- [ ] If `GEMINI_API_KEY` is not provisioned, verify that deterministic fallback engines take over smoothly without runtime crashes.
- [ ] If `SAFEBROWSING_API_KEY` is omitted, verify that UI renders "Reputation Feed Unavailable" rather than false clean.

---

## 3. Security Sanity Checks

- [ ] Helmet security headers active (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`).
- [ ] Server does NOT execute `fetch()` or redirects on user-submitted URLs.
- [ ] Sliding-window rate limiter is enabled on `/api/analyze/*` (100 req/15min) and `/api/history/*` (300 req/15min).
- [ ] Request body parser enforces strict 50KB size cap.
- [ ] Input string sanitization strips null bytes and enforces maximum lengths (2,048 chars for URLs, 5,000 for messages).
- [ ] Sensitive inputs (passwords, OTPs, raw message text) are redacted in server application logs.

---

## 4. UI/UX & Accessibility (WCAG 2.1 AA)

- [ ] All forms operable via keyboard navigation (Tab, Enter, Space).
- [ ] Risk badges display visible icons and clear text labels (never color alone).
- [ ] Color contrast exceeds 4.5:1 ratio across dark mode themes.
- [ ] Screen readers announce live notifications (`role="status"`, `aria-live="polite"`).
- [ ] Reduced-motion media query respected (`@media (prefers-reduced-motion: reduce)`).

---

## 5. Deployment & Release Tagging

- [ ] Update `CHANGELOG.md` with release version, date, and changes.
- [ ] Update version number in `package.json`, `client/package.json`, and `server/package.json`.
- [ ] Create signed Git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`.
- [ ] Push commits and tags: `git push origin main --tags`.
- [ ] Verify GitHub Actions CI quality gate passes completely.
- [ ] Trigger deployment on hosting platform (Vercel / Render / Docker).
- [ ] Run live smoke test on production health check: `GET /api/health`.
