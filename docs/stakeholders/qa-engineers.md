# QA Engineer Guide

This guide is for quality engineers validating backend, frontend, and cloud release behavior.

## QA Scope

- Functional and regression testing across services and MFEs.
- Test automation quality for unit, integration, E2E, and post-deploy checks.
- Release readiness sign-off based on objective gates.

## Test Surface Map

| Test Layer | Primary Paths | Notes |
|---|---|---|
| Backend unit tests | [tests/HealthQCopilot.Tests.Unit](../../tests/HealthQCopilot.Tests.Unit) | Aggregate and domain behavior coverage |
| Backend integration tests | [tests/HealthQCopilot.Tests.Integration](../../tests/HealthQCopilot.Tests.Integration) | Testcontainers-based persistence and integration coverage |
| Frontend app tests | [frontend/apps](../../frontend/apps) | Vitest + Testing Library coverage per MFE |
| Local E2E pipeline | [.github/workflows/e2e-tests.yml](../../.github/workflows/e2e-tests.yml) | Playwright local validation workflow |
| Cloud E2E pipeline | [.github/workflows/cloud-e2e-tests.yml](../../.github/workflows/cloud-e2e-tests.yml) | Smoke gate and full cloud regression suite |
| Visual regression | [.github/workflows/chromatic.yml](../../.github/workflows/chromatic.yml) | Storybook visual baseline checks |
| UX performance checks | [.github/workflows/lighthouse-ci.yml](../../.github/workflows/lighthouse-ci.yml) | Core Web Vitals and quality budgets |

## Local QA Workflow

### 1) Run backend test suites

```bash
dotnet test tests/HealthQCopilot.Tests.Unit
dotnet test tests/HealthQCopilot.Tests.Integration
```

### 2) Run frontend test suites

```bash
cd frontend
pnpm install
pnpm test
pnpm test:e2e
```

### 3) Run cloud-targeted frontend tests

```bash
cd frontend
pnpm test:e2e:cloud
```

## Release Sign-Off Inputs

Minimum evidence before approving a release candidate:

1. PR quality gate is green in [pr-validation.yml](../../.github/workflows/pr-validation.yml).
2. Changed services and MFEs were built and deployed by CI workflows.
3. Cloud smoke gate passes in [cloud-e2e-tests.yml](../../.github/workflows/cloud-e2e-tests.yml).
4. Full E2E suite passes for the target release branch or commit.
5. No unresolved critical regressions in triage, voice, scheduling, or gateway flows.

## High-Risk Areas to Prioritize

- Cross-MFE event contract behavior in [frontend/packages/mfe-events/src/index.ts](../../frontend/packages/mfe-events/src/index.ts).
- Voice-to-triage handoff and escalation workflows.
- API gateway routing and BFF aggregation behavior.
- Backward compatibility for payload shape normalization in frontend consumers.

## QA Checklist for Every Significant Change

- Add or update automated tests for each bug fix.
- Validate both success and failure states for async UI flows.
- Validate at least one end-to-end path for each impacted user journey.
- Record test evidence in PR comments or release notes.
