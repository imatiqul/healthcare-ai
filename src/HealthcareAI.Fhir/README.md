# HealthcareAI.Fhir

FHIR R4 proxy microservice that provides a normalized API for clinical health records, bridging the platform's internal domain model with the HAPI FHIR server.

## Bounded Context

**Health Records** — owns the clinical data layer. Proxies FHIR R4 resources (Patient, Encounter, Appointment) to the HAPI FHIR server while maintaining a local read model in PostgreSQL for fast queries and event-driven updates.

## Technology Choices

| Technology | Why |
|---|---|
| **ASP.NET Core Minimal APIs** | Lightweight proxy endpoints for FHIR resource CRUD operations |
| **HAPI FHIR Server (v7.2)** | Industry-standard open-source FHIR R4 server — stores canonical clinical records |
| **Entity Framework Core 9 + Npgsql** | Local read model for fast queries without hitting the FHIR server on every request |
| **HttpClientFactory** | Typed HTTP client for HAPI FHIR communication with resilience policies |
| **Dapr 1.14** | Subscribes to `TriageCompleted` and `DocumentProcessed` events; publishes `SlotChanged` events |
| **Aspire ServiceDefaults** | Health checks, OTel tracing across FHIR proxy calls |
| **Transactional Outbox** | Reliable event delivery for `SlotChanged` notifications |

## Core Aggregates

| Aggregate | Key Behaviors |
|---|---|
| `Patient` | FHIR Patient resource management, demographics |
| `Encounter` | Clinical encounter tracking, linked to triage outcomes |
| `Appointment` | FHIR Appointment resource, linked to scheduling |

## Integration Events

| Event | Published When | Consumers |
|---|---|---|
| `SlotChanged` | Appointment slot availability changes | Scheduling Service |

**Subscribes to:** `TriageCompleted` (AI Agent), `DocumentProcessed` (OCR)

## Running

### Local (Aspire — Recommended)
```bash
dotnet run --project src/HealthcareAI.AppHost
```

### Local (Standalone with Dapr)
```bash
docker compose up -d postgres-fhir redis hapi-fhir
cd src/HealthcareAI.Fhir
dapr run --app-id fhir-service --app-port 5003 \
  --resources-path ../../infra/dapr/components-local \
  -- dotnet run
```

## Environment Configuration

| Setting | Local (Aspire) | Docker Compose | Staging | Production |
|---|---|---|---|---|
| **Port** | Auto-assigned | 5003 | K8s service | K8s service |
| **Database** | `fhir_db` (Aspire-managed) | `Host=localhost;Port=5436` | Key Vault | Key Vault |
| **HAPI FHIR URL** | Aspire-managed container | `http://localhost:8090` | Azure FHIR endpoint | Azure Health Data Services |
| **Redis** | Aspire-managed | `localhost:6379` | Azure Redis | Azure Redis (Premium) |

## Dependencies

- **PostgreSQL** — `fhir_db` for local read model
- **HAPI FHIR Server** — canonical FHIR R4 resource storage
- **Redis** — response caching for frequently accessed resources
- **AI Agent Service** — upstream `TriageCompleted` events
- **OCR Service** — upstream `DocumentProcessed` events
