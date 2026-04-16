# HealthQCopilot.Scheduling

Appointment management microservice that handles provider slot availability, patient booking, and FHIR-linked appointment lifecycle management.

## Bounded Context

**Appointment Management** — owns the scheduling domain: slot creation, reservation (with pessimistic concurrency), booking confirmation, and release. Integrates with FHIR for standardized appointment resources.

## Technology Choices

| Technology | Why |
|---|---|
| **ASP.NET Core Minimal APIs** | REST endpoints for slot queries, booking creation, and availability management |
| **Entity Framework Core 9 + Npgsql** | PostgreSQL with row-level locking for concurrent slot reservations — prevents double-booking |
| **Dapr 1.14** | Subscribes to `SlotChanged` events from FHIR; state store for slot availability caching in Redis |
| **Aspire ServiceDefaults** | Health checks, OTel tracing across booking workflows |
| **Transactional Outbox** | Reliable delivery of booking confirmation events |

## Core Aggregates

| Aggregate | Key Behaviors |
|---|---|
| `Slot` | Available → Reserved → Booked state machine; release returns to Available; concurrency-safe via pessimistic locking |
| `Booking` | Creation, FHIR appointment linking, cancellation |

## Running

### Local (Aspire — Recommended)
```bash
dotnet run --project src/HealthQCopilot.AppHost
```

### Local (Standalone with Dapr)
```bash
docker compose up -d postgres-scheduling redis
cd src/HealthQCopilot.Scheduling
dapr run --app-id scheduling-service --app-port 5005 \
  --resources-path ../../infra/dapr/components-local \
  -- dotnet run
```

## Environment Configuration

| Setting | Local (Aspire) | Docker Compose | Staging | Production |
|---|---|---|---|---|
| **Port** | Auto-assigned | 5005 | K8s service | K8s service |
| **Database** | `scheduling_db` (Aspire-managed) | `Host=localhost;Port=5438` | Key Vault | Key Vault |
| **Redis** | Aspire-managed | `localhost:6379` | Azure Redis | Azure Redis (Premium) |

## Dependencies

- **PostgreSQL** — `scheduling_db` for slot and booking persistence
- **Redis** — slot availability cache for fast calendar queries
- **FHIR Service** — upstream `SlotChanged` events; linked FHIR Appointment resources
