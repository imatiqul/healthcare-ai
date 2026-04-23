# Backend Engineer Guide

This guide is for engineers building and maintaining the .NET backend services.

## What You Own

- Domain models, aggregates, and invariants.
- Service APIs, event publishing/subscription, and persistence behavior.
- Reliability patterns (outbox, retries, idempotency, health checks).
- Backend unit and integration test quality.

## Backend Code Map

| Area | Path | Why It Matters |
|---|---|---|
| Domain model and events | [src/HealthQCopilot.Domain](../../src/HealthQCopilot.Domain) | Shared aggregates, value objects, domain events |
| Cross-cutting infra | [src/HealthQCopilot.Infrastructure](../../src/HealthQCopilot.Infrastructure) | Outbox relay, middleware, observability, resilience |
| Service defaults | [src/HealthQCopilot.ServiceDefaults](../../src/HealthQCopilot.ServiceDefaults) | Shared startup conventions and defaults |
| Runtime orchestration | [src/HealthQCopilot.AppHost](../../src/HealthQCopilot.AppHost) | Local distributed app orchestration |
| API gateway | [src/HealthQCopilot.Gateway](../../src/HealthQCopilot.Gateway) | YARP reverse proxy and service routing |
| GraphQL BFF | [src/HealthQCopilot.BFF](../../src/HealthQCopilot.BFF) | Aggregated query surface for frontend clients |
| Tests | [tests/HealthQCopilot.Tests.Unit](../../tests/HealthQCopilot.Tests.Unit), [tests/HealthQCopilot.Tests.Integration](../../tests/HealthQCopilot.Tests.Integration) | Behavioral regression safety |

## Service Inventory

| Service | Project |
|---|---|
| Identity | [src/HealthQCopilot.Identity](../../src/HealthQCopilot.Identity) |
| Voice | [src/HealthQCopilot.Voice](../../src/HealthQCopilot.Voice) |
| Agents | [src/HealthQCopilot.Agents](../../src/HealthQCopilot.Agents) |
| FHIR | [src/HealthQCopilot.Fhir](../../src/HealthQCopilot.Fhir) |
| OCR | [src/HealthQCopilot.Ocr](../../src/HealthQCopilot.Ocr) |
| Scheduling | [src/HealthQCopilot.Scheduling](../../src/HealthQCopilot.Scheduling) |
| Notifications | [src/HealthQCopilot.Notifications](../../src/HealthQCopilot.Notifications) |
| Population Health | [src/HealthQCopilot.PopulationHealth](../../src/HealthQCopilot.PopulationHealth) |
| Revenue Cycle | [src/HealthQCopilot.RevenueCycle](../../src/HealthQCopilot.RevenueCycle) |
| API Gateway | [src/HealthQCopilot.Gateway](../../src/HealthQCopilot.Gateway) |
| GraphQL BFF | [src/HealthQCopilot.BFF](../../src/HealthQCopilot.BFF) |

## Local Development Workflow

### 1) Build and run the full backend topology

```bash
dotnet restore
dotnet build HealthQCopilot.sln
dotnet run --project src/HealthQCopilot.AppHost
```

### 2) Service-focused loop (example: Voice service)

```bash
docker compose up -d postgres-voice redis
cd src/HealthQCopilot.Voice
dapr run --app-id voice-service --app-port 5001 \
  --resources-path ../../infra/dapr/components-local \
  -- dotnet run
```

### 3) Run tests continuously

```bash
dotnet test tests/HealthQCopilot.Tests.Unit
dotnet test tests/HealthQCopilot.Tests.Integration
```

## Event-Driven Contract Hotspots

Key events currently used across services:

- `TranscriptProduced` (Voice -> Agents)
- `TriageCompleted` (Agents -> downstream services)
- `EscalationRequired` (Agents -> notification/human workflow)

When adding or changing events:

1. Update domain event contracts first.
2. Keep handlers idempotent.
3. Add regression coverage in unit/integration tests.

## Quality Gates That Affect Backend PRs

- [.github/workflows/pr-validation.yml](../../.github/workflows/pr-validation.yml)
  - Build
  - Formatting check
  - Unit tests + coverage threshold
  - Security scan
- [.github/workflows/microservice-deploy.yml](../../.github/workflows/microservice-deploy.yml)
  - Service matrix build
  - Trivy scan
  - Image publish and deploy path

## Backend PR Checklist

- Domain changes include tests for happy path and failure path.
- API contract changes are reflected in endpoint code and consuming callers.
- New background processing is observable (logs + metrics + health).
- Cross-service behavior is event-based where possible, not tightly coupled HTTP.
- CI quality gates pass before merge.
