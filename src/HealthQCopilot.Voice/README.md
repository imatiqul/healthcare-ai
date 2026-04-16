# HealthQCopilot.Voice

Real-time voice communication microservice that captures audio streams from clinical encounters, manages voice sessions, and produces transcripts that drive downstream AI triage.

## Bounded Context

**Voice Communication** — owns the entire lifecycle of a voice session: start → stream audio → produce transcript → end. Publishes `TranscriptProduced` events that trigger the AI Agent Service.

## Technology Choices

| Technology | Why |
|---|---|
| **ASP.NET Core Minimal APIs** | REST endpoints for session management (start, stop, query) |
| **SignalR** | WebSocket-based real-time communication — streams audio bidirectionally between clinical devices and the server with auto-reconnection |
| **Entity Framework Core 9 + Npgsql** | Persists voice sessions and transcript metadata to PostgreSQL |
| **Dapr 1.14** | Pub/sub for `TranscriptProduced` events; state store for session caching in Redis |
| **Aspire ServiceDefaults** | Standardized health checks, OpenTelemetry tracing across SignalR hubs |
| **Transactional Outbox** | Ensures `TranscriptProduced` events are reliably delivered even if Service Bus is temporarily down |

## Core Aggregates

| Aggregate | Key Behaviors |
|---|---|
| `VoiceSession` | Start → stream → transcript produced → end; invalid state transitions raise domain errors |
| `AudioStream` | Value object representing a recorded audio fragment with format metadata |

## API Endpoints

- REST endpoints in `Endpoints/VoiceEndpoints.cs` — session CRUD, transcript retrieval
- SignalR hub at `/hubs/voice` — real-time audio streaming

## Integration Events

| Event | Published When | Consumers |
|---|---|---|
| `TranscriptProduced` | Voice transcript is finalized | AI Agent Service (triggers triage) |

## Running

### Local (Aspire — Recommended)
```bash
dotnet run --project src/HealthQCopilot.AppHost
```

### Local (Standalone with Dapr)
```bash
docker compose up -d postgres-voice redis
cd src/HealthQCopilot.Voice
dapr run --app-id voice-service --app-port 5001 \
  --resources-path ../../infra/dapr/components-local \
  -- dotnet run
```

## Environment Configuration

| Setting | Local (Aspire) | Docker Compose | Staging | Production |
|---|---|---|---|---|
| **Port** | Auto-assigned | 5001 | K8s service | K8s service |
| **Database** | `voice_db` (Aspire-managed) | `Host=localhost;Port=5434` | Key Vault | Key Vault |
| **Redis** | Aspire-managed | `localhost:6379` | Azure Redis | Azure Redis (Premium) |
| **SignalR** | In-process | In-process | Azure SignalR Service | Azure SignalR Service |

## Dependencies

- **PostgreSQL** — `voice_db` for session and transcript persistence
- **Redis** — active session state caching
- **AI Agent Service** — consumes `TranscriptProduced` events
