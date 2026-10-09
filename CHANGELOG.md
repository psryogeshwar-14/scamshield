# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-09

### Added
- **11-Point Deterministic URL Threat Heuristics**: Added detection for missing HTTPS, IP addresses, URL shorteners, excessive subdomains, brand impersonation keywords, high-abuse TLDs, punycode homoglyphs, excessive hyphens, and high-entropy domain strings.
- **Google Safe Browsing v4 Integration**: Added live reputation lookup with a 5-second `AbortController` timeout and clean/threat/unavailable state resolution.
- **Google Gemini 2.5 Flash Structured Analysis**: Enforced schema-validated structured output with a 10-second timeout guard.
- **Deterministic Offline Fallbacks**: Comprehensive pattern-matching engine detecting OTP fraud, payment scams, fake jobs, malware, and phishing when external APIs are unconfigured or offline.
- **Multi-Pillar "Why This Result?" Section**: Transparent breakdown covering deterministic heuristics, external feeds, AI intent reasoning, and confidence limitations.
- **Centralized Security Hardening**: Helmet security headers (CSP, nosniff, frameguard), strict CORS origin filtering, 50KB payload cap, and sliding-window rate limiting.
- **Privacy-Preserving Server Logging**: Hash fingerprinting and redacting sensitive input bodies in logs.
- **Interactive Safety Action Checklist**: Actionable step-by-step mitigation plans with database state persistence and optimistic UI updates.
- **Automated Testing Suite**: 83 automated unit, integration, and component tests across server and client workspaces using Vitest and React Testing Library.
- **Accessible UI & Design Tokens**: Enhanced Tailwind CSS styling, screen reader ARIA labels, semantic roles, high-contrast badges with text/icons, and reduced-motion media query support.
- **Workspace Tooling**: Root workspace npm scripts for synchronized setup, linting, testing, coverage, and building.

### Changed
- Refactored server architecture into decoupled routes, controllers, services, middleware, validators, and config layers.
- Resolved database connection path resolution dynamically to guarantee SQLite persistence across execution directories.
- Normalized RiskBadge component to support multi-cased and alias inputs with accessible icons and text labels.
- Replaced legacy styles with modern Tailwind CSS classes across all client views.

### Fixed
- Fixed false "Clean Threat Feed" badge rendering when Safe Browsing was unconfigured or timed out (now accurately shows "Reputation Feed Unavailable").
- Fixed generic action words (`signin`, `login`, `verify`) incorrectly triggering false-positive brand impersonation on legitimate domains.
- Fixed unconstrained database scans in history queries by enforcing page and limit boundaries.
