# Contributing to ScamShield

Thank you for your interest in contributing to ScamShield! We appreciate contributions that improve code reliability, cybersecurity protections, accessibility, documentation, and user experience.

---

## Code of Conduct

All contributors and maintainers are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior to the project maintainers.

---

## Development Workflow

### 1. Prerequisites
- Node.js ≥ 18.0.0 (LTS recommended)
- npm ≥ 9.0.0
- Git

### 2. Fork and Clone
```bash
git clone https://github.com/your-username/scamshield.git
cd scamshield
```

### 3. Setup Project
Run the automated workspace initialization script:
```bash
npm run setup
```
This installs dependencies in both `server/` and `client/` and generates the Prisma client.

### 4. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 5. Running Locally
```bash
# Start backend and frontend simultaneously
npm run dev

# Backend runs at: http://localhost:3001
# Frontend runs at: http://localhost:5173
```

---

## Testing & Quality Standards

Before submitting a pull request, ensure all verification steps pass locally:

```bash
# 1. Run all 144 automated tests (94 server, 50 client)
npm test

# 2. Check code coverage (>81% global line coverage)
npm run test:coverage

# 3. Run static analysis & linting (oxlint on 52 files)
npm run lint

# 4. Run dependency security audit
npm run audit

# 5. Verify database migration & demo seeding
npm run db:migrate && npm run db:seed

# 6. Verify production builds
npm run build
```

### Testing Guidelines:
- **Zero Real API Calls in Tests**: Never make real network requests to Google Gemini or Safe Browsing in tests. Always use mocked responses.
- **No Fabricated Claims**: Do not add assertion workarounds or dummy metrics.
- **Coverage**: New service features or heuristics must include unit test fixtures in `server/test/` or `client/src/test/`.

---

## Pull Request Guidelines

1. Fill out the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md) completely.
2. Link any related GitHub issues.
3. Keep commits atomic and use conventional commit messages (`feat: ...`, `fix: ...`, `docs: ...`, `test: ...`).
4. Ensure the CI workflow passes on GitHub Actions.
