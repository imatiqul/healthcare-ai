# Revenue MFE

Micro frontend for **revenue cycle management** — provides the coding queue for medical billing and prior authorization tracking interface.

## Exposed Components

| Component | Path | Description |
|---|---|---|
| `CodingQueue` | `./src/components/CodingQueue.tsx` | Medical coding worklist with procedure/diagnosis code assignment |
| `PriorAuthTracker` | `./src/components/PriorAuthTracker.tsx` | Prior authorization request status tracking and management |

## Technology Choices

| Technology | Version | Why |
|---|---|---|
| **Vite** | 6.4 | Fast builds; optimized chunking for code-heavy views |
| **@module-federation/vite** | 1.14 | Independently deployable remote consumed by Shell |
| **React** | 19 | Concurrent rendering for large coding worklists |
| **MUI** | 6.4 | Data grid for worklist management, form controls for code entry, status chips for authorization tracking |
| **zustand** | 5 | Shared state for queue filters, selected encounters, and auth request status |

## Running

```bash
cd frontend
pnpm dev          # Starts on port 3005

# Standalone
cd frontend/apps/revenue-mfe
pnpm dev
```

## Environment Configuration

| Setting | Local | Staging | Production |
|---|---|---|---|
| **Port** | 3005 | Azure Static Web Apps | CDN |
| **API Proxy** | Vite proxy to backend | API Management | API Management |

## Backend Service

Communicates with backend services for:
- Encounter and coding data (via FHIR Service)
- Prior authorization submission and tracking (REST API)
