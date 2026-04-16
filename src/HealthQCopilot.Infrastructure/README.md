# HealthQCopilot.Infrastructure

Shared infrastructure layer providing cross-cutting concerns for all microservices: persistence, messaging, observability, resilience, and HIPAA-compliant audit middleware.

## Why This Project Exists

Every microservice in the platform needs the same infrastructure plumbing — database access, outbox-based messaging, telemetry, and resilience policies. Centralizing these into a single shared library eliminates duplication and ensures consistent behavior across all 8 services.

## Technology Choices

| Technology | Version | Why |
|---|---|---|
| **Entity Framework Core** | 9.0.1 | Strongly-typed ORM with migration support; Npgsql provider for PostgreSQL |
| **Npgsql.EF Core** | 9.0.3 | First-class PostgreSQL support (JSONB, arrays, advisory locks for outbox) |
| **Azure.Messaging.ServiceBus** | 7.18.2 | Production messaging backbone for cross-service async events |
| **Dapr Client** | 1.14.0 | Portable pub/sub, state, and secret abstractions — avoids vendor lock-in |
| **MediatR** | 12.4.1 | In-process CQRS command/query dispatching within each service |
| **Polly** | 8.5.0 | Resilience policies (retry, circuit breaker, timeout) for external calls |
| **OpenTelemetry** | 1.12.0 | Distributed tracing, metrics, and log correlation across all services |
| **Serilog** | 9.0.0 | Structured logging with Application Insights sink + correlation enricher |
| **Health Checks** | 9.0.0 | Kubernetes liveness/readiness probes |

## Structure

```
HealthQCopilot.Infrastructure/
├── Persistence/           # OutboxDbContext — transactional outbox pattern implementation
├── Messaging/             # OutboxRelayService — background service that relays outbox events to Service Bus
├── Observability/         # AddHealthcareObservability() — configures OTel traces + Serilog + Prometheus
├── Middleware/            # PhiAuditMiddleware — logs all PHI access for HIPAA audit trails
└── Resilience/            # Polly 8 policies — timeout, retry with jitter, circuit breaker
```

## Key Components

### Transactional Outbox
`OutboxDbContext` stores domain events in the same transaction as aggregate state changes. `OutboxRelayService` runs as a background `IHostedService` that polls the outbox and relays events to Azure Service Bus, ensuring exactly-once delivery semantics.

### PHI Audit Middleware
Every HTTP request involving Protected Health Information is logged with: user identity, resource accessed, action performed, and timestamp — required for HIPAA compliance.

### Observability Setup
`AddHealthcareObservability()` configures:
- OpenTelemetry traces (ASP.NET Core, HTTP client, EF Core instrumentations)
- Prometheus metrics endpoint
- Serilog structured logging with correlation IDs and Application Insights sink

## Environment Configuration

| Environment | Connection Strings | Messaging |
|---|---|---|
| **Local (Aspire)** | Auto-injected by Aspire AppHost | In-process (no Service Bus needed) |
| **Local (Docker Compose)** | `Host=localhost;Port=543X;Database=...` per service | Redis-based Dapr pub/sub |
| **Staging** | Azure Key Vault managed identity | Azure Service Bus (Standard) |
| **Production** | Azure Key Vault managed identity | Azure Service Bus (Premium) |

## Usage

```csharp
// In any microservice's Program.cs
builder.Services.AddHealthcareObservability(builder.Configuration, "my-service");
builder.Services.AddDbContext<MyDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("MyDb")));
builder.Services.AddHostedService<OutboxRelayService<MyDbContext>>();

app.UseMiddleware<PhiAuditMiddleware>();
```
