# HealthcareAI.Agents

AI-powered clinical triage microservice that uses **Microsoft Semantic Kernel** to orchestrate LLM-based decision-making for patient triage workflows, with human-in-the-loop escalation for high-priority cases.

## Bounded Context

**Clinical AI** — owns the triage decision lifecycle. Receives transcripts from the Voice Service, runs them through an AI-powered triage pipeline, and produces structured clinical decisions with priority levels and recommended actions.

## Technology Choices

| Technology | Version | Why |
|---|---|---|
| **Microsoft Semantic Kernel** | 1.54.0 | Enterprise-grade AI orchestration framework from Microsoft — supports plugins, planners, and multiple LLM backends (Azure OpenAI, OpenAI, local models) with built-in token management and retry logic |
| **ASP.NET Core Minimal APIs** | — | Lightweight REST endpoints for triage submission and status queries |
| **Entity Framework Core 9 + Npgsql** | — | Persists triage workflows, decisions, and audit trails to PostgreSQL |
| **Dapr 1.14** | — | Subscribes to `TranscriptProduced` events; publishes `TriageCompleted` and `EscalationRequired` events |
| **Aspire ServiceDefaults** | — | Standardized health checks, OTel tracing (traces span across LLM calls) |
| **Transactional Outbox** | — | Guarantees triage result events are delivered reliably |

## Core Aggregates

| Aggregate | Key Behaviors |
|---|---|
| `TriageWorkflow` | P1 escalation, P3 auto-complete, human approval flow, escalation to clinician |
| `AgentDecision` | AI-generated decision with confidence score, priority level, and reasoning |

## Semantic Kernel Integration

### Plugins
- **TriagePlugin** — registered as a kernel plugin, exposes clinical triage functions that the AI planner can invoke
- Plugin collection is defined at startup and injected into the kernel

### TriageOrchestrator
Scoped service that coordinates the triage workflow:
1. Receives transcript from Voice Service event
2. Invokes Semantic Kernel with the TriagePlugin
3. Produces a structured `AgentDecision` with priority (P1–P5)
4. P1/P2 cases trigger `EscalationRequired` for human-in-the-loop review

## Integration Events

| Event | Published When | Consumers |
|---|---|---|
| `TriageCompleted` | AI triage decision is finalized | FHIR Service, Notification Service |
| `EscalationRequired` | P1/P2 case needs human review | Notification Service (pages clinician) |

**Subscribes to:** `TranscriptProduced` (from Voice Service)

## API Endpoints

Defined in `Endpoints/AgentEndpoints.cs` — triage submission, workflow status, decision history.

## Running

### Local (Aspire — Recommended)
```bash
dotnet run --project src/HealthcareAI.AppHost
```

### Local (Standalone with Dapr)
```bash
docker compose up -d postgres-agent redis qdrant
cd src/HealthcareAI.Agents
dapr run --app-id agent-service --app-port 5002 \
  --resources-path ../../infra/dapr/components-local \
  -- dotnet run
```

## Environment Configuration

| Setting | Local (Aspire) | Docker Compose | Staging | Production |
|---|---|---|---|---|
| **Port** | Auto-assigned | 5002 | K8s service | K8s service |
| **Database** | `agent_db` (Aspire-managed) | `Host=localhost;Port=5435` | Key Vault | Key Vault |
| **Redis** | Aspire-managed | `localhost:6379` | Azure Redis | Azure Redis (Premium) |
| **Qdrant** | Aspire-managed container | `localhost:6333` | Azure managed | Azure managed |
| **LLM Endpoint** | Azure OpenAI (dev key) | Azure OpenAI (dev key) | Azure OpenAI (staging) | Azure OpenAI (production) |

## Kubernetes Scaling

This service uses **KEDA autoscaling** with:
- Service Bus queue length trigger
- Prometheus-based custom metrics (triage latency)
- **Argo Rollouts** canary strategy: 20% → 50% → 100%, gated on hallucination rate < 5% and API success rate > 99%

## Dependencies

- **PostgreSQL** — `agent_db` for workflow and decision persistence
- **Redis** — decision caching and session state
- **Qdrant** — vector store for clinical knowledge retrieval (RAG)
- **Azure OpenAI** — LLM backend for Semantic Kernel
- **Voice Service** — upstream event source (`TranscriptProduced`)
