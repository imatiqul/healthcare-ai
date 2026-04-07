# Scheduling MFE

Micro frontend for **appointment booking** — provides a visual slot calendar, booking form, and appointment management interface.

## Exposed Components

| Component | Path | Description |
|---|---|---|
| `SlotCalendar` | `./src/components/SlotCalendar.tsx` | Interactive calendar showing provider slot availability |
| `BookingForm` | `./src/components/BookingForm.tsx` | Patient appointment booking form with validation |

## Technology Choices

| Technology | Version | Why |
|---|---|---|
| **Vite** | 6.4 | Instant HMR; optimized production bundles |
| **@module-federation/vite** | 1.14 | Independently deployable remote consumed by Shell |
| **React** | 19 | Concurrent rendering keeps the calendar responsive during slot updates |
| **MUI** | 6.4 | Date picker components, form controls, and data grid for appointment lists — built-in accessibility for healthcare UX |
| **zustand** | 5 | Shared state for selected date/provider/slot across calendar and booking form |

## Running

```bash
cd frontend
pnpm dev          # Starts on port 3003

# Standalone
cd frontend/apps/scheduling-mfe
pnpm dev
```

## Environment Configuration

| Setting | Local | Staging | Production |
|---|---|---|---|
| **Port** | 3003 | Azure Static Web Apps | CDN |
| **API Proxy** | `http://localhost:5005` (Vite proxy) | API Management | API Management |

## Backend Service

Communicates with **HealthcareAI.Scheduling** (port 5005) for:
- Slot availability queries (REST API)
- Booking creation and management (REST API)
