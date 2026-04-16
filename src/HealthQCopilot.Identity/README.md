# HealthQCopilot.Identity

Authentication and authorization microservice for the HealthQ Copilot platform. Manages user accounts, practitioner profiles, and Entra ID integration.

## Bounded Context

**Identity & Access Management** — owns all user identity data, authentication flows, and role-based access control. No other service stores user credentials or manages auth sessions.

## Technology Choices

| Technology | Why |
|---|---|
| **ASP.NET Core Minimal APIs** | Lightweight HTTP endpoints without controller overhead — ideal for auth endpoints that need minimal abstraction |
| **Entity Framework Core 9 + Npgsql** | Strongly-typed persistence with PostgreSQL; migration support for schema evolution |
| **Dapr 1.14** | Secret store integration for Key Vault access; pub/sub for user provisioning events |
| **Aspire ServiceDefaults** | Standardized health checks, OpenTelemetry, and service discovery |
| **Transactional Outbox** | Domain events (e.g., UserRegistered) are stored atomically with state changes and relayed to Service Bus |

## Core Aggregates

| Aggregate | Key Behaviors |
|---|---|
| `UserAccount` | Registration, profile management, role assignment |
| `Practitioner` | Provider profile linked to FHIR Practitioner resource |

## API Endpoints

Defined in `Endpoints/IdentityEndpoints.cs`. All endpoints are prefixed with `/api/identity`.

## Running

### Local (Aspire — Recommended)
```bash
# From repo root — launches all services including Identity
dotnet run --project src/HealthQCopilot.AppHost
```

### Local (Standalone with Dapr)
```bash
docker compose up -d postgres-identity redis
cd src/HealthQCopilot.Identity
dapr run --app-id identity-service --app-port 5000 \
  --resources-path ../../infra/dapr/components-local \
  -- dotnet run
```

## Environment Configuration

| Setting | Local (Aspire) | Docker Compose | Staging | Production |
|---|---|---|---|---|
| **Port** | Auto-assigned | 5000 | K8s service | K8s service |
| **Database** | `identity_db` (Aspire-managed) | `Host=localhost;Port=5433` | Key Vault | Key Vault |
| **Redis** | Aspire-managed | `localhost:6379` | Azure Redis | Azure Redis (Premium) |
| **Auth Provider** | Local dev tokens | Local dev tokens | Entra ID (test tenant) | Entra ID (prod tenant) |

## Dependencies

- **PostgreSQL** — `identity_db` for user account persistence
- **Redis** — session caching and token storage
- **Service Bus** — publishes `UserRegistered`, `RoleChanged` events
