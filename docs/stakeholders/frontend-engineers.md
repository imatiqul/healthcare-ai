# Frontend Engineer Guide

This guide is for engineers working on the shell app, remote MFEs, and shared frontend packages.

## Frontend Scope

- Shell host application and route composition.
- 7 remote MFEs loaded via Module Federation.
- Shared package contracts (design system, event bus, GraphQL client, Web PubSub client).
- Frontend unit tests and cloud E2E integration quality.

## Frontend Code Map

| Area | Path | Purpose |
|---|---|---|
| Shell host app | [frontend/apps/shell](../../frontend/apps/shell) | Hosts routes and loads remote MFEs |
| Voice MFE | [frontend/apps/voice-mfe](../../frontend/apps/voice-mfe) | Voice session and transcript UI |
| Triage MFE | [frontend/apps/triage-mfe](../../frontend/apps/triage-mfe) | Triage review and HITL workflows |
| Scheduling MFE | [frontend/apps/scheduling-mfe](../../frontend/apps/scheduling-mfe) | Scheduling workflows |
| PopHealth MFE | [frontend/apps/pophealth-mfe](../../frontend/apps/pophealth-mfe) | Population risk and care gap workflows |
| Revenue MFE | [frontend/apps/revenue-mfe](../../frontend/apps/revenue-mfe) | Revenue and prior auth workflows |
| Encounters MFE | [frontend/apps/encounters-mfe](../../frontend/apps/encounters-mfe) | Clinical encounter workflow |
| Engagement MFE | [frontend/apps/engagement-mfe](../../frontend/apps/engagement-mfe) | Patient engagement workflows |
| Shared packages | [frontend/packages](../../frontend/packages) | Reusable contracts and utilities |

## Shared Package Contracts

| Package | Path | Use Case |
|---|---|---|
| Event bus | [frontend/packages/mfe-events/src/index.ts](../../frontend/packages/mfe-events/src/index.ts) | Typed cross-MFE CustomEvent contracts |
| GraphQL client | [frontend/packages/graphql-client/src/index.ts](../../frontend/packages/graphql-client/src/index.ts) | Shared GraphQL transport helpers |
| Web PubSub client | [frontend/packages/web-pubsub-client/src/index.ts](../../frontend/packages/web-pubsub-client/src/index.ts) | Real-time streaming to UI |
| Design system | [frontend/packages/design-system](../../frontend/packages/design-system) | Shared components and UI consistency |
| Auth client | [frontend/packages/auth-client](../../frontend/packages/auth-client) | Authentication state contract |

## Local Development Workflow

```bash
cd frontend
pnpm install
pnpm dev
```

Useful commands:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm test:e2e
pnpm test:e2e:cloud
```

Run a single app test target:

```bash
pnpm --filter "./apps/triage-mfe" run test
```

## Integration Surface You Should Treat as Contracts

1. Module Federation remote entry and manifest URLs.
2. Cross-MFE event names and payloads in `@healthcare/mfe-events`.
3. API and GraphQL response shapes consumed by each MFE.
4. Real-time message envelope types in the Web PubSub client package.

## Quality Gates That Affect Frontend PRs

- [.github/workflows/pr-validation.yml](../../.github/workflows/pr-validation.yml)
  - Lint
  - Type check
  - Unit tests (all apps)
  - Build and bundle budget checks
- [.github/workflows/frontend-deploy.yml](../../.github/workflows/frontend-deploy.yml)
  - Changed-app matrix build and deploy
- [.github/workflows/cloud-e2e-tests.yml](../../.github/workflows/cloud-e2e-tests.yml)
  - Post-deploy smoke and full cloud validation

## Frontend PR Checklist

- Shared package changes are backward compatible for all consuming MFEs.
- New events include typed payloads and listener cleanup behavior.
- Accessibility and async UI states are covered in tests.
- Cloud E2E impact is considered for shell-to-remote integration.
