# HealthQCopilot.Notifications

Patient engagement and outreach microservice that manages multi-channel notification campaigns, clinical alerts, and human-in-the-loop escalation messaging.

## Bounded Context

**Patient Engagement** — owns outreach campaigns (SMS, email, push), clinical alert routing, and escalation notifications for human-in-the-loop triage review. No other service sends patient-facing or clinician-facing notifications.

## Technology Choices

| Technology | Why |
|---|---|
| **ASP.NET Core Minimal APIs** | REST endpoints for campaign management and notification status |
| **Entity Framework Core 9 + Npgsql** | Persists campaign state, message delivery tracking, and notification audit logs |
| **Dapr 1.14** | Subscribes to `TriageCompleted`, `EscalationRequired`, and `CareGapIdentified` events; state store for delivery status |
| **Aspire ServiceDefaults** | Health checks, OTel tracing across notification delivery pipelines |
| **Transactional Outbox** | Guarantees notification delivery tracking events are persisted |

## Core Aggregates

| Aggregate | Key Behaviors |
|---|---|
| `OutreachCampaign` | Draft → Active → Complete/Cancel lifecycle; manages cohort targeting and scheduling |
| `Message` | Individual notification with delivery status tracking (sent, delivered, failed, read) |

## Integration Events

**Subscribes to:**
| Event | Source | Action |
|---|---|---|
| `TriageCompleted` | AI Agent Service | Sends result notification to patient/provider |
| `EscalationRequired` | AI Agent Service | Pages on-call clinician for human review |
| `CareGapIdentified` | Population Health Service | Queues outreach for care gap closure |

## Running

### Local (Aspire — Recommended)
```bash
dotnet run --project src/HealthQCopilot.AppHost
```

### Local (Standalone with Dapr)
```bash
docker compose up -d postgres-notification redis
cd src/HealthQCopilot.Notifications
dapr run --app-id notification-service --app-port 5006 \
  --resources-path ../../infra/dapr/components-local \
  -- dotnet run
```

## Environment Configuration

| Setting | Local (Aspire) | Docker Compose | Staging | Production |
|---|---|---|---|---|
| **Port** | Auto-assigned | 5006 | K8s service | K8s service |
| **Database** | `notification_db` (Aspire-managed) | `Host=localhost;Port=5439` | Key Vault | Key Vault |
| **Redis** | Aspire-managed | `localhost:6379` | Azure Redis | Azure Redis (Premium) |
| **SMS Provider** | Console logger (mock) | Console logger (mock) | Azure Communication Services | Azure Communication Services |
| **Email Provider** | Console logger (mock) | Console logger (mock) | SendGrid (staging) | SendGrid (production) |

## Kubernetes Scaling

This service uses **KEDA autoscaling** with Service Bus queue length trigger — scales based on notification backlog volume.

## Dependencies

- **PostgreSQL** — `notification_db` for campaign and message persistence
- **Redis** — delivery status caching and deduplication
- **AI Agent Service** — upstream `TriageCompleted` and `EscalationRequired` events
- **Population Health Service** — upstream `CareGapIdentified` events
