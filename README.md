# Healthcare AI — Cloud Native Platform

Production-grade healthcare AI platform built on **8 DDD bounded-context microservices** running on Azure Kubernetes Service, orchestrated locally via **Microsoft Aspire**, communicating asynchronously via Azure Service Bus, and presented through **6 independently deployable micro frontends** federated at runtime with Module Federation.

Every service follows Domain-Driven Design with Clean Architecture, CQRS, and the Transactional Outbox pattern. AI triage is powered by **Microsoft Semantic Kernel**. Deployments are GitOps-driven via ArgoCD with progressive canary rollouts.

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
dotnet run --project src/HealthcareAI.AppHost
```

### Option B — Docker Compose + Dapr

```bash
# Start all infrastructure dependencies (8 Postgres instances, Redis, HAPI FHIR,
# Qdrant, SQL Server + Service Bus emulator, Dapr placement, Zipkin)
docker compose up -d

# Initialize Dapr with local components
dapr init

# Run a single service with Dapr sidecar
cd src/HealthcareAI.Voice
dapr run --app-id voice-service --app-port 5001 \
  --resources-path ../../infra/dapr/components-local \
  -- dotnet run

# Or build all services
dotnet build HealthcareAI.sln
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev          # Starts Shell (3000) + all 5 MFEs (3001-3005)
```

### Tests

```bash
# Unit tests
dotnet test tests/HealthcareAI.Tests.Unit

# Integration tests (requires Docker for Testcontainers)
dotnet test tests/HealthcareAI.Tests.Integration
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
| **Infrastructure** | AKS (4 node pools), Bicep, ArgoCD, Argo Rollouts, KEDA |
| **Observability** | OpenTelemetry 1.12, Azure Monitor, Prometheus, Grafana, Zipkin |
| **Security** | Entra ID, Managed Identity, Key Vault, SMART on FHIR, zero-trust network policies |

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
healthcare-ai/
├── src/                                  # .NET 9 microservices (12 projects)
│   ├── HealthcareAI.Domain/              # Shared DDD primitives & aggregates
│   │   ├── Primitives/                   #   Entity, AggregateRoot, ValueObject, Result
│   │   ├── Voice/                        #   VoiceSession, AudioStream, events
│   │   ├── Agents/                       #   TriageWorkflow, AgentDecision, events
│   │   ├── Scheduling/                   #   Slot, Booking
│   │   ├── Ocr/                          #   OcrJob, events
│   │   ├── PopulationHealth/             #   PatientRisk, CareGap
│   │   ├── Notifications/               #   OutreachCampaign, Message
│   │   └── Identity/                     #   UserAccount
│   ├── HealthcareAI.Infrastructure/      # Shared infrastructure
│   │   ├── Persistence/                  #   OutboxDbContext (transactional outbox)
│   │   ├── Messaging/                    #   OutboxRelayService (Service Bus relay)
│   │   ├── Observability/                #   OpenTelemetry + Serilog setup
│   │   ├── Middleware/                   #   PHI audit middleware (HIPAA)
│   │   └── Resilience/                   #   Polly 8 (timeout, retry, circuit breaker)
│   ├── HealthcareAI.AppHost/             # Aspire orchestrator — launches all services + infra
│   ├── HealthcareAI.ServiceDefaults/     # Aspire shared defaults (OTel, health, resilience)
│   ├── HealthcareAI.Identity/            # Auth service
│   ├── HealthcareAI.Voice/               # Real-time voice service
│   ├── HealthcareAI.Agents/              # AI triage service (Semantic Kernel)
│   ├── HealthcareAI.Fhir/                # FHIR R4 proxy service
│   ├── HealthcareAI.Ocr/                 # Document processing service
│   ├── HealthcareAI.Scheduling/          # Appointment service
│   ├── HealthcareAI.Notifications/       # Patient outreach service
│   └── HealthcareAI.PopulationHealth/    # Risk scoring service
│
├── tests/
│   ├── HealthcareAI.Tests.Unit/          # 8 test classes covering all aggregates
│   └── HealthcareAI.Tests.Integration/   # Testcontainers-based integration tests
│
├── frontend/                             # Turborepo monorepo (pnpm)
│   ├── apps/
│   │   ├── shell/                        # Host app — Vite 6 + Module Federation, port 3000
│   │   ├── voice-mfe/                    # Voice session UI, port 3001
│   │   ├── triage-mfe/                   # AI triage viewer, port 3002
│   │   ├── scheduling-mfe/              # Appointment booking, port 3003
│   │   ├── pophealth-mfe/               # Population health, port 3004
│   │   └── revenue-mfe/                 # Revenue cycle, port 3005
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
│   ├── pr-validation.yml                 # Quality gates on PR
│   ├── microservice-deploy.yml           # Per-service matrix deploy to AKS
│   ├── frontend-deploy.yml               # MFE matrix deploy to Static Web Apps
│   └── infra-deploy.yml                  # Bicep validation + deployment
│
├── docker-compose.yml                    # Local dev: 15 containers
├── HealthcareAI.sln                      # .NET solution (12 src + 2 test = 14 projects)
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
| **Pop. Health** | 3004 | `pophealth` | RiskPanel, CareGapList |
| **Revenue** | 3005 | `revenue` | CodingQueue, PriorAuthTracker |

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
| `network` | VNet /14, 5 subnets | AKS, APIM, data, services, endpoints |
| `aks` | AKS cluster | 4 node pools: system, api, ai (GPU), batch (spot) |
| `acr` | Container Registry | Premium SKU with geo-replication |
| `apim` | API Management | Internal VNet mode + WAF |
| `service-bus` | Service Bus | Premium SKU, 7 topics |
| `postgres` | 8 Flexible Servers | One per microservice, HA enabled |
| `redis` | Redis Cache | Premium with TLS, persistence |
| `key-vault` | Key Vault | Secrets, certificates, managed identity access |
| `log-analytics` | Log Analytics | Central log sink |
| `app-insights` | Application Insights | APM + distributed tracing |
| `dapr-extension` | Dapr AKS Extension | v1.14, managed by AKS |
| `managed-identities` | 8 Managed Identities | Per-service with federated credentials |

### Kubernetes

- **KEDA autoscaling** for AI Agent (Service Bus + Prometheus), OCR (Service Bus, scale-to-zero), Notification (Service Bus), Pop. Health (cron nightly)
- **11 network policies** enforcing zero-trust: default deny-all, allow DNS, allow Dapr sidecar, per-service ingress/egress rules
- **Argo Rollouts** for AI Agent with canary strategy: 20% → 50% → 100%, gated on hallucination rate < 5% and API success rate > 99%
- **Helm chart** with per-service resource limits, node selectors, tolerations, and Dapr annotations

### Deployment

```bash
# Deploy infrastructure
az deployment sub create \
  --location eastus2 \
  --template-file infra/bicep/main.bicep \
  --parameters infra/bicep/main.prod.bicepparam

# Deploy services via ArgoCD
kubectl apply -f infra/argocd/project.yaml
kubectl apply -f infra/argocd/application.yaml
```

---

## CI/CD Pipelines

| Workflow | Trigger | What It Does |
|---|---|---|
| `pr-validation.yml` | Pull request | .NET build + test + format check; frontend lint + type-check |
| `microservice-deploy.yml` | Push to `main` (src changes) | Per-service matrix: build → test → ACR push → Helm values update |
| `frontend-deploy.yml` | Push to `main` (frontend changes) | Per-MFE matrix: pnpm build → Azure Static Web Apps deploy |
| `infra-deploy.yml` | Push to `main` (infra changes) | Bicep what-if → approval gate → subscription deployment |

All workflows use `dorny/paths-filter` for selective triggering — only changed services/MFEs are built and deployed.

---

## Testing

| Project | Framework | Scope | Test Count |
|---|---|---|---|
| `HealthcareAI.Tests.Unit` | xUnit + FluentAssertions + NSubstitute | All domain aggregates | 33 tests across 8 files |
| `HealthcareAI.Tests.Integration` | xUnit + Testcontainers 4.3 | Database persistence | PostgreSQL 16 container |

### Unit Test Coverage

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
