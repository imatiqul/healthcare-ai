# Triage MFE

Micro frontend for **AI triage visualization** — displays triage workflow results, AI agent decisions, and the human-in-the-loop escalation interface.

## Exposed Components

| Component | Path | Description |
|---|---|---|
| `TriageViewer` | `./src/components/TriageViewer.tsx` | Displays triage results with priority levels and AI reasoning |
| `HitlEscalationModal` | `./src/components/HitlEscalationModal.tsx` | Human-in-the-loop modal for P1/P2 case review and clinician approval |

## Technology Choices

| Technology | Version | Why |
|---|---|---|
| **Vite** | 6.4 | Fast development builds; HMR for rapid UI iteration |
| **@module-federation/vite** | 1.14 | Independently deployable remote consumed by Shell |
| **React** | 19 | Concurrent rendering for smooth triage data updates |
| **MUI** | 6.4 | Data-rich tables, alert components, and priority-based color theming for clinical urgency levels |
| **zustand** | 5 | Shared state for triage workflow status across views |

## Running

```bash
cd frontend
pnpm dev          # Starts on port 3002

# Standalone
cd frontend/apps/triage-mfe
pnpm dev
```

## Environment Configuration

| Setting | Local | Staging | Production |
|---|---|---|---|
| **Port** | 3002 | Azure Static Web Apps | CDN |
| **API Proxy** | `http://localhost:5002` (Vite proxy) | API Management | API Management |

## Backend Service

Communicates with **HealthcareAI.Agents** (port 5002) for:
- Triage workflow status and decision history (REST API)
- Real-time triage updates (SignalR)
