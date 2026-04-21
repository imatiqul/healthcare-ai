# HealthQ Copilot — Cloud Native Platform

Production-grade HealthQ Copilot platform built on **10 DDD bounded-context microservices** running on **Azure Container Apps**, orchestrated locally via **Microsoft Aspire**, communicating asynchronously via Azure Service Bus, and presented through **8 independently deployable micro frontends** federated at runtime with Module Federation.

Every service follows Domain-Driven Design with Clean Architecture, CQRS, and the Transactional Outbox pattern. AI triage is powered by **Microsoft Semantic Kernel**. Container images are scanned with Trivy, secrets are audited with Gitleaks, and deployments are progressively rolled out via Argo Rollouts with canary analysis gates.

---

## Quick Start

### Prerequisites

- [.NET 9 SDK](https://dot.net/download) + [.NET Aspire workload](https://learn.microsoft.com/en-us/dotnet/aspire/fundamentals/setup-tooling) (`dotnet workload install aspire`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with Compose v2)
- [Dapr CLI](https://docs.dapr.io/getting-started/install-dapr-cli/)
- [Node.js 20+](https://nodejs.org/) & [pnpm 9+](https://pnpm.io/installation)

### Option A — Aspire (Recommended)

```bash
# Start all 8 microservices + infrastructure (Postgres, Redis, HAPI FHIR, Qdrant)
# with the Aspire dashboard at https://localhost:15888
dotnet run --project src/HealthQCopilot.AppHost
```

### Option B — Docker Compose + Dapr

```bash
# Start all infrastructure dependencies (8 Postgres instances, Redis, HAPI FHIR,
# Qdrant, SQL Server + Service Bus emulator, Dapr placement, Zipkin)
docker compose up -d

# Initialize Dapr with local components
dapr init

# Run a single service with Dapr sidecar
cd src/HealthQCopilot.Voice
dapr run --app-id voice-service --app-port 5001 \
  --resources-path ../../infra/dapr/components-local \
  -- dotnet run

# Or build all services
dotnet build HealthQCopilot.sln
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev          # Starts Shell (3000) + all 7 MFEs (3001-3007)
```

### Tests

```bash
# Unit tests
dotnet test tests/HealthQCopilot.Tests.Unit

# Integration tests (requires Docker for Testcontainers)
dotnet test tests/HealthQCopilot.Tests.Integration
```

---

## Architecture

### Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Gateway** | Azure API Management + WAF, NGINX Ingress, Azure Front Door |
| **Services** | .NET 9 (C# 13), ASP.NET Core Minimal APIs, MediatR 12.4, Dapr 1.14, Semantic Kernel 1.54 |
| **Orchestration** | Microsoft Aspire 9.2 (AppHost + ServiceDefaults) |
| **Patterns** | DDD, Clean Architecture, CQRS, Transactional Outbox, Saga |
| **Messaging** | Azure Service Bus (Premium), Azure Event Grid |
| **Data** | PostgreSQL 16 (per-service), FHIR R4, Redis 7, Qdrant 1.9, Blob Storage |
| **Frontend** | Vite 6, React 19, React Router 7, Module Federation, Turborepo, MUI 6.4, zustand 5 |
| **Infrastructure** | Azure Container Apps, Bicep, ArgoCD, Argo Rollouts, KEDA |
| **Observability** | OpenTelemetry 1.12, Azure Monitor, Prometheus, Grafana, Zipkin |
| **Security** | Entra ID, Managed Identity, Key Vault, SMART on FHIR, Trivy, Gitleaks, zero-trust network policies |

### Design Principles

- **Database per service** — no shared schemas; each microservice owns its data exclusively
- **Asynchronous-first** — Azure Service Bus for all cross-service events; synchronous REST only for same-request reads
- **Stateless services** — all state externalized to PostgreSQL, Redis, or Azure Blob; pods are disposable
- **GitOps source of truth** — cluster state reconciles from Git via ArgoCD; drift is detected and corrected automatically
- **Zero stored credentials** — Azure Managed Identity + Key Vault everywhere; no environment variable secrets
- **Observable by default** — OpenTelemetry traces, structured Serilog logs, and Prometheus metrics from every service
- **HIPAA-compliant by construction** — PHI encrypted at rest (AES-256), in transit (TLS 1.3), audit-logged on every access

---

## Project Structure

```
healthq-copilot/
├── src/                                  # .NET 9 microservices (15 projects)
│   ├── HealthQCopilot.Domain/              # Shared DDD primitives & aggregates
│   │   ├── Primitives/                   #   Entity, AggregateRoot, ValueObject, Result
│   │   ├── Voice/                        #   VoiceSession, AudioStream, events
│   │   ├── Agents/                       #   TriageWorkflow, AgentDecision, events
│   │   ├── Scheduling/                   #   Slot, Booking
│   │   ├── Ocr/                          #   OcrJob, events
│   │   ├── PopulationHealth/             #   PatientRisk, CareGap
│   │   ├── Notifications/               #   OutreachCampaign, Message
│   │   └── Identity/                     #   UserAccount
│   ├── HealthQCopilot.Infrastructure/      # Shared infrastructure
│   │   ├── Persistence/                  #   OutboxDbContext (transactional outbox)
│   │   ├── Messaging/                    #   OutboxRelayService (Service Bus relay)
│   │   ├── Observability/                #   OpenTelemetry + Serilog setup
│   │   ├── Middleware/                   #   PHI audit middleware (HIPAA)
│   │   └── Resilience/                   #   Polly 8 (timeout, retry, circuit breaker)
│   ├── HealthQCopilot.AppHost/             # Aspire orchestrator — launches all services + infra
│   ├── HealthQCopilot.ServiceDefaults/     # Aspire shared defaults (OTel, health, resilience)
│   ├── HealthQCopilot.Identity/            # Auth service
│   ├── HealthQCopilot.Voice/               # Real-time voice service
│   ├── HealthQCopilot.Agents/              # AI triage service (Semantic Kernel)
│   ├── HealthQCopilot.Fhir/                # FHIR R4 proxy service
│   ├── HealthQCopilot.Ocr/                 # Document processing service
│   ├── HealthQCopilot.Scheduling/          # Appointment service
│   ├── HealthQCopilot.Notifications/       # Patient outreach service
│   ├── HealthQCopilot.PopulationHealth/    # Risk scoring service
│   ├── HealthQCopilot.RevenueCycle/        # Revenue cycle & claims service
│   ├── HealthQCopilot.Gateway/             # YARP reverse-proxy / BFF gateway
│   └── HealthQCopilot.BFF/                 # Backend-for-Frontend (aggregation layer)
│
├── tests/
│   ├── HealthQCopilot.Tests.Unit/          # 8 test classes covering all aggregates
│   └── HealthQCopilot.Tests.Integration/   # Testcontainers-based integration tests
│
├── frontend/                             # Turborepo monorepo (pnpm)
│   ├── apps/
│   │   ├── shell/                        # Host app — Vite 6 + Module Federation, port 3000
│   │   ├── voice-mfe/                    # Voice session UI, port 3001
│   │   ├── triage-mfe/                   # AI triage viewer, port 3002
│   │   ├── scheduling-mfe/              # Appointment booking, port 3003
│   │   ├── pophealth-mfe/               # Population health, port 3004
│   │   ├── revenue-mfe/                 # Revenue cycle, port 3005
│   │   ├── encounters-mfe/              # Clinical encounters & FHIR records, port 3006
│   │   └── engagement-mfe/              # Patient portal & outreach campaigns, port 3007
│   └── packages/
│       ├── design-system/                # Shared UI components (MUI 6.4 + Emotion)
│       ├── auth-client/                  # Framework-agnostic React Context auth
│       ├── signalr-client/               # Real-time hub connection factory
│       ├── fhir-types/                   # TypeScript FHIR R4 types
│       └── tsconfig/                     # Shared TypeScript configs (Vite + base)
│
├── infra/
│   ├── bicep/                            # Azure IaC — 12 modules
│   │   ├── main.bicep                    # Subscription-scoped orchestrator
│   │   ├── main.dev.bicepparam           # Dev environment parameters
│   │   ├── main.prod.bicepparam          # Prod environment parameters
│   │   └── modules/                      # network, aks, acr, apim, service-bus,
│   │                                     # postgres, redis, key-vault, log-analytics,
│   │                                     # app-insights, dapr-extension, managed-identities
│   ├── dapr/
│   │   ├── components/                   # Production Dapr components (6 configs)
│   │   └── components-local/             # Local dev components (Redis-based)
│   ├── helm/                             # Helm chart for all services
│   │   ├── Chart.yaml
│   │   ├── values.yaml                   # Production values (8 services)
│   │   ├── values.dev.yaml               # Dev overrides
│   │   └── templates/                    # Deployment, service, ingress, rollout,
│   │                                     # analysis, namespace, serviceaccount
│   ├── k8s/
│   │   ├── network-policies/             # 11 zero-trust network policies
│   │   └── keda/                         # 4 KEDA ScaledObjects
│   └── argocd/                           # GitOps application configs
│
├── .github/workflows/                    # CI/CD pipelines
│   ├── pr-validation.yml                 # Quality gates on PR (lint, type-check, test)
│   ├── microservice-deploy.yml           # Per-service matrix build → Trivy scan → ACA deploy
│   ├── frontend-deploy.yml               # MFE matrix build → Azure Static Web Apps deploy
│   ├── infra-deploy.yml                  # Bicep what-if → approval → subscription deploy
│   ├── compliance-check.yml              # Weekly: Gitleaks + Trivy CVE + OWASP ZAP + k6
│   ├── deployment-health.yml             # Daily + post-deploy ACA health dashboard
│   ├── cloud-e2e-tests.yml               # Cloud end-to-end test suite
│   ├── e2e-tests.yml                     # Local end-to-end tests (Playwright)
│   ├── chromatic.yml                     # Visual regression tests (Storybook / Chromatic)
│   ├── lighthouse-ci.yml                 # Core Web Vitals via Lighthouse CI
│   └── rollback.yml                      # One-click rollback to previous image tag
│
├── docker-compose.yml                    # Local dev: 15 containers
├── HealthQCopilot.sln                      # .NET solution (15 src + 2 test = 17 projects)
└── Directory.Build.props                 # .NET 9, C# 13, nullable, TreatWarningsAsErrors
```

---

## Microservices

### Bounded Contexts

| Bounded Context | Service | Core Aggregates | Port | Database |
|---|---|---|---|---|
| Identity & Access | Identity | `UserAccount`, `Practitioner` | 5000 | postgres-identity |
| Voice Communication | Voice | `VoiceSession`, `AudioStream` | 5001 | postgres-voice |
| Clinical AI | AI Agent | `TriageWorkflow`, `AgentDecision` | 5002 | postgres-agent |
| Health Records | FHIR | `Patient`, `Encounter`, `Appointment` | 5003 | postgres-fhir |
| Document Processing | OCR | `OcrJob`, `ClinicalDocument` | 5004 | postgres-ocr |
| Appointment Management | Scheduling | `Slot`, `Booking` | 5005 | postgres-scheduling |
| Patient Engagement | Notification | `OutreachCampaign`, `Message` | 5006 | postgres-notification |
| Population Analytics | Pop. Health | `PatientRisk`, `CareGap` | 5007 | postgres-pophealth |
| Revenue Cycle | Revenue | `Claim`, `DenialCase`, `PriorAuth` | 5008 | postgres-revenue |
| API Gateway | Gateway | — (YARP reverse proxy) | 5009 | — |

### Key Integration Events

```
Voice Service ──TranscriptProduced──▶ AI Agent Service
AI Agent Service ──TriageCompleted──▶ FHIR Service, Notification Service
AI Agent Service ──EscalationRequired──▶ Notification Service (human-in-the-loop)
OCR Service ──DocumentProcessed──▶ FHIR Service
FHIR Service ──SlotChanged──▶ Scheduling Service
Pop. Health Service ──CareGapIdentified──▶ Notification Service
```

### Dapr Building Blocks

| Building Block | Component | Purpose |
|---|---|---|
| Pub/Sub | Azure Service Bus | Async event-driven communication |
| State Store | Redis | Session state, slot availability cache |
| Secret Store | Azure Key Vault | Connection strings, API keys |
| Input Binding | Azure Blob Storage | Document upload triggers (OCR) |
| Input Binding | Event Grid | FHIR change events |
| Resiliency | Built-in | Circuit breakers + retries per service |

---

## Micro Frontends

| MFE | Port | Module Federation Name | Exposed Components |
|---|---|---|---|
| **Shell** (host) | 3000 | `shell` | Sidebar, TopNav, Dashboard |
| **Voice** | 3001 | `voice` | VoiceSessionController, LiveTranscriptFeed |
| **Triage** | 3002 | `triage` | TriageViewer, HitlEscalationModal |
| **Scheduling** | 3003 | `scheduling` | SlotCalendar, BookingForm |
| **Pop. Health** | 3004 | `pophealth` | RiskPanel, CareGapList, PatientSearch, CostPredictionPanel, SdohAssessmentPanel |
| **Revenue** | 3005 | `revenue` | CodingQueue, PriorAuthTracker, DenialManager |
| **Encounters** | 3006 | `encounters` | EncounterList, MedicationPanel, AllergyPanel, ProblemListPanel, ImmunizationPanel, DrugInteractionChecker, FhirObservationViewer, DicomViewer |
| **Engagement** | 3007 | `engagement` | PatientPortal, NotificationInbox, CampaignManagerPanel, PatientRegistrationForm, ConsentManagementPanel, OcrDocumentPanel, GdprErasurePanel |

### Shared Packages

| Package | Purpose |
|---|---|
| `@healthcare/design-system` | Button, Card, Badge, Input — MUI 6.4 + Emotion themed components |
| `@healthcare/auth-client` | Framework-agnostic React Context auth with Entra ID OIDC |
| `@healthcare/signalr-client` | Singleton hub connection factory with auto-reconnect |
| `@healthcare/fhir-types` | TypeScript types for Patient, Encounter, Appointment, Slot, etc. |
| `@healthcare/tsconfig` | Base + Vite TypeScript configurations |

---

## Infrastructure

### Azure Resources (Bicep)

The infrastructure is defined as 12 Bicep modules deployed at subscription scope:

| Module | Resource | Notes |
|---|---|---|
| `network` | VNet /14, 5 subnets | ACA, APIM, data, services, endpoints |
| `aca` | Azure Container Apps Environment | 10 container apps, per-service scaling rules |
| `acr` | Container Registry | Premium SKU with geo-replication |
| `apim` | API Management | Internal VNet mode + WAF |
| `service-bus` | Service Bus | Premium SKU, 7 topics |
| `postgres` | 8 Flexible Servers | One per microservice, HA enabled |
| `redis` | Redis Cache | Premium with TLS, persistence |
| `key-vault` | Key Vault | Secrets, certificates, managed identity access |
| `log-analytics` | Log Analytics | Central log sink |
| `app-insights` | Application Insights | APM + distributed tracing |
| `dapr-extension` | Dapr ACA Extension | v1.14 |
| `managed-identities` | 10 Managed Identities | Per-service with federated credentials |

### Scaling & Rollout

- **KEDA autoscaling** — AI Agent (Service Bus + Prometheus), OCR (Service Bus, scale-to-zero), Notification (Service Bus), Pop. Health (cron nightly)
- **Argo Rollouts** — AI Agent canary strategy: 20% → 50% → 100%, gated on hallucination rate < 5% and API success rate > 99%
- **Azure Container Apps** — per-service min/max replica rules, HTTP-trigger scaling for API services

### Deployment

```bash
# Deploy infrastructure
az deployment sub create \
  --location eastus2 \
  --template-file infra/bicep/main.bicep \
  --parameters infra/bicep/main.prod.bicepparam

# Deploy a specific container app (CI does this automatically via microservice-deploy.yml)
az containerapp update \
  --name healthq-voice \
  --resource-group healthq-copilot-rg \
  --image ghcr.io/imatiqul/healthcare-ai/healthq-copilot-voice:latest
```

---

## CI/CD Pipelines

| Workflow | Trigger | What It Does |
|---|---|---|
| `pr-validation.yml` | Pull request | .NET build + test + format check; frontend lint + type-check + unit tests |
| `microservice-deploy.yml` | Push to `main` (src changes) | Per-service matrix: build → Trivy scan → GHCR push → ACA deploy |
| `frontend-deploy.yml` | Push to `main` (frontend changes) | Per-MFE matrix: pnpm build → Azure Static Web Apps deploy |
| `infra-deploy.yml` | Push to `main` (infra changes) | Bicep what-if → approval gate → subscription deployment |
| `compliance-check.yml` | Weekly (Mon 08:00 UTC) + manual | Gitleaks secrets audit + Trivy CVE scan + OWASP ZAP + k6 load test |
| `deployment-health.yml` | Daily + post-deploy | ACA service health probes + gateway smoke tests + SWA availability |
| `cloud-e2e-tests.yml` | Push to `main` | End-to-end tests against cloud environment |
| `e2e-tests.yml` | Pull request | Playwright E2E tests (local containers) |
| `chromatic.yml` | Pull request | Storybook visual regression via Chromatic |
| `lighthouse-ci.yml` | Pull request | Core Web Vitals performance budget enforcement |
| `rollback.yml` | Manual | One-click rollback to previous container image tag |

All workflows use `dorny/paths-filter` for selective triggering — only changed services/MFEs are built and deployed.

---

## Testing

### Backend (.NET)

| Project | Framework | Scope | Test Count |
|---|---|---|---|
| `HealthQCopilot.Tests.Unit` | xUnit + FluentAssertions + NSubstitute | All domain aggregates | 33 tests across 8 files |
| `HealthQCopilot.Tests.Integration` | xUnit + Testcontainers 4.3 | Database persistence | PostgreSQL 16 container |

### Frontend (Vitest + React Testing Library)

| MFE | Test Files | Tests | Key Coverage |
|---|---|---|---|
| `shell` | 48 | 370 | Dashboard, Sidebar, CopilotChat, ModelGovernance, BreakGlassAccess, OnboardingWizard, WhatsNew |
| `engagement-mfe` | 16 | 109 | PatientPortal, NotificationInbox, CampaignManagerPanel, PatientRegistrationForm, OcrDocumentPanel |
| `encounters-mfe` | 11 | 84 | EncounterList, AllergyPanel, DrugInteractionChecker, ImmunizationPanel, ProblemListPanel, DicomViewer |
| `pophealth-mfe` | 8 | 53 | PatientSearch, CostPredictionPanel, SdohAssessmentPanel, RiskDashboard |
| `revenue-mfe` | 3 | 18 | DenialManager, CodingQueue, PriorAuthTracker |

**Total frontend: 86 test files, 634 tests — all passing.**

All frontend tests run with accessibility coverage via `jest-axe`, strict `aria-*` queries, and a 15 000 ms timeout for async user-event interactions.

### Backend Unit Test Coverage

| Test File | Aggregate | Key Scenarios |
|---|---|---|
| `VoiceSessionTests` | VoiceSession | Start, transcript production, end, invalid state transitions |
| `TriageWorkflowTests` | TriageWorkflow | P1 escalation, P3 auto-complete, human approval, escalate |
| `SlotTests` | Slot | Reserve/book/release state machine, concurrency failures |
| `BookingTests` | Booking | Creation, FHIR appointment linking |
| `OcrJobTests` | OcrJob | Queue → processing → complete/fail lifecycle, events |
| `PatientRiskTests` | PatientRisk | Risk levels (Theory), score assignment |
| `OutreachCampaignTests` | OutreachCampaign | Draft → active → complete/cancel lifecycle |
| `AudioStreamTests` | AudioStream | Value object equality semantics |

---

## Docker Compose (Local Development)

The `docker-compose.yml` provides a complete local environment with 15 containers:

| Service | Image | Port |
|---|---|---|
| 8 × PostgreSQL | `postgres:16-alpine` | 5433–5440 |
| Redis | `redis:7-alpine` | 6379 |
| HAPI FHIR Server | `hapiproject/hapi:v7.2.0` | 8090 |
| Qdrant (vectors) | `qdrant/qdrant:v1.9.0` | 6333, 6334 |
| SQL Server (SB backing) | `mcr.microsoft.com/mssql/server:2022-latest` | 1433 |
| Service Bus Emulator | `azure-messaging/servicebus-emulator` | 5672, 5300 |
| Dapr Placement | `daprio/dapr:1.14` | 50006 |
| Zipkin (tracing) | `openzipkin/zipkin:3` | 9411 |

---

## License

Proprietary — All rights reserved.
