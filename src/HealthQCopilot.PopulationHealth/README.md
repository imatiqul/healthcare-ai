# HealthQCopilot.PopulationHealth

Population analytics microservice that performs risk scoring, care gap identification, and cohort analysis to drive proactive patient outreach.

## Bounded Context

**Population Analytics** — owns patient risk stratification, care gap detection, and outreach campaign triggering. Analyzes population-level health data to identify patients who need proactive intervention.

## Technology Choices

| Technology | Why |
|---|---|
| **ASP.NET Core Minimal APIs** | REST endpoints for risk queries, care gap lists, and cohort analysis |
| **Entity Framework Core 9 + Npgsql** | Persists risk scores, care gaps, and campaign data to PostgreSQL; supports complex analytical queries |
| **Dapr 1.14** | Pub/sub for `CareGapIdentified` events; scheduled invocations for nightly batch processing |
| **Aspire ServiceDefaults** | Health checks, OTel tracing |
| **Transactional Outbox** | Reliable delivery of `CareGapIdentified` events to Notification Service |

## Core Aggregates

| Aggregate | Key Behaviors |
|---|---|
| `PatientRisk` | Risk level assignment (Low/Medium/High/Critical) based on clinical data; theory-driven scoring |
| `CareGap` | Identifies gaps in preventive care (missed screenings, overdue vaccinations) |
| `OutreachCampaign` | Population-level campaign targeting specific care gaps |

## Integration Events

| Event | Published When | Consumers |
|---|---|---|
| `CareGapIdentified` | New care gap detected for a patient cohort | Notification Service (triggers outreach) |

## Running

### Local (Aspire — Recommended)
```bash
dotnet run --project src/HealthQCopilot.AppHost
```

### Local (Standalone with Dapr)
```bash
docker compose up -d postgres-pophealth redis
cd src/HealthQCopilot.PopulationHealth
dapr run --app-id pophealth-service --app-port 5007 \
  --resources-path ../../infra/dapr/components-local \
  -- dotnet run
```

## Environment Configuration

| Setting | Local (Aspire) | Docker Compose | Staging | Production |
|---|---|---|---|---|
| **Port** | Auto-assigned | 5007 | K8s service | K8s service |
| **Database** | `pophealth_db` (Aspire-managed) | `Host=localhost;Port=5440` | Key Vault | Key Vault |
| **Redis** | Aspire-managed | `localhost:6379` | Azure Redis | Azure Redis (Premium) |

## Kubernetes Scaling

This service uses **KEDA autoscaling** with a **cron trigger** — scales up for nightly batch risk scoring and scales back down during off-hours.

## Dependencies

- **PostgreSQL** — `pophealth_db` for risk scores, care gaps, and campaign data
- **Redis** — caching for frequently queried risk panels
- **Notification Service** — consumes `CareGapIdentified` events for patient outreach
