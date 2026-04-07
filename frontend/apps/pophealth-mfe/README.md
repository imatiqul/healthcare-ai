# Population Health MFE

Micro frontend for **population health analytics** — displays patient risk panels, care gap lists, and cohort analysis dashboards.

## Exposed Components

| Component | Path | Description |
|---|---|---|
| `RiskPanel` | `./src/components/RiskPanel.tsx` | Patient risk stratification display with color-coded severity levels |
| `CareGapList` | `./src/components/CareGapList.tsx` | Filterable list of identified care gaps with outreach status |

## Technology Choices

| Technology | Version | Why |
|---|---|---|
| **Vite** | 6.4 | Fast builds for data-heavy dashboard views |
| **@module-federation/vite** | 1.14 | Independently deployable remote consumed by Shell |
| **React** | 19 | Concurrent rendering for large data sets without blocking the UI |
| **MUI** | 6.4 | Data grid, charts integration points, color-coded chips for risk levels — consistent with platform design system |
| **zustand** | 5 | Shared state for selected filters, date ranges, and cohort selections |

## Running

```bash
cd frontend
pnpm dev          # Starts on port 3004

# Standalone
cd frontend/apps/pophealth-mfe
pnpm dev
```

## Environment Configuration

| Setting | Local | Staging | Production |
|---|---|---|---|
| **Port** | 3004 | Azure Static Web Apps | CDN |
| **API Proxy** | `http://localhost:5007` (Vite proxy) | API Management | API Management |

## Backend Service

Communicates with **HealthcareAI.PopulationHealth** (port 5007) for:
- Patient risk scores and care gap queries (REST API)
- Cohort analysis endpoints (REST API)
