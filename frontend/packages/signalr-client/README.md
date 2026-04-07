# @healthcare/signalr-client

Singleton SignalR hub connection factory with automatic reconnection, shared across all micro frontends via Module Federation.

## Why SignalR (Shared Singleton)

| Reason | Details |
|---|---|
| **Single Connection Pool** | One WebSocket connection per hub shared across all MFEs — avoids multiplying connections per micro frontend |
| **Auto-Reconnection** | Built-in reconnection logic with exponential backoff — maintains real-time updates through transient network issues |
| **Module Federation Singleton** | Configured as a shared singleton in federation config — all MFEs use the same connection instance |
| **Type-Safe Hub Proxy** | Typed hub method invocations and subscriptions |

## Usage

```tsx
import { createHubConnection } from '@healthcare/signalr-client';

// Creates or retrieves the singleton connection for the specified hub
const connection = createHubConnection('/hubs/voice');

// Subscribe to server events
connection.on('TranscriptUpdated', (data) => {
  // Handle real-time transcript updates
});

// Invoke server methods
await connection.invoke('StartSession', sessionId);
```

## Hub Endpoints

| Hub URL | Backend Service | Purpose |
|---|---|---|
| `/hubs/voice` | HealthcareAI.Voice (5001) | Real-time audio streaming and transcript updates |

## Environment Configuration

| Setting | Local | Staging | Production |
|---|---|---|---|
| **Transport** | WebSocket (direct) | Azure SignalR Service | Azure SignalR Service |
| **Base URL** | `ws://localhost:{port}` | Azure SignalR endpoint | Azure SignalR endpoint |

## Peer Dependencies

- `@microsoft/signalr`
