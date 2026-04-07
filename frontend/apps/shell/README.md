# Shell (Host App)

The shell is the **host application** for the Healthcare AI micro frontend architecture. It loads and orchestrates all 5 remote MFE applications at runtime using Module Federation, provides the global layout (sidebar, top navigation), and manages shared state and routing.

## Why Vite + Module Federation

| Technology | Version | Why |
|---|---|---|
| **Vite** | 6.4 | Sub-second HMR, native ES module dev server, and optimized Rollup-based production builds — significantly faster than webpack-based alternatives |
| **@module-federation/vite** | 1.14 | Runtime federation of independently deployed micro frontends without build-time coupling — each MFE can be deployed independently |
| **React** | 19 | Concurrent rendering, improved Suspense, and use() hook for better async data loading |
| **React Router DOM** | 7.1 | Client-side routing with lazy-loaded federated components per route |
| **MUI** | 6.4 | Enterprise-grade component library with built-in accessibility (WCAG 2.1 AA), theming, and responsive design — chosen over Tailwind for consistent healthcare UI patterns |
| **Emotion** | 11.14 | CSS-in-JS runtime used by MUI for dynamic theme-based styling |
| **zustand** | 5 | Lightweight state management (2KB) — singleton shared instance across all MFEs via Module Federation |
| **@microsoft/signalr** | — | Real-time updates from backend services (voice sessions, notifications) — shared as singleton across MFEs |

## Remote MFEs

The shell consumes 5 remote MFEs configured via environment variables (with localhost defaults):

| Remote | Default URL | Manifest |
|---|---|---|
| voice | `http://localhost:3001` | `/mf-manifest.json` |
| triage | `http://localhost:3002` | `/mf-manifest.json` |
| scheduling | `http://localhost:3003` | `/mf-manifest.json` |
| pophealth | `http://localhost:3004` | `/mf-manifest.json` |
| revenue | `http://localhost:3005` | `/mf-manifest.json` |

## Shared Singletons

These dependencies are shared across all MFEs to avoid duplicate instances:
- `react` / `react-dom` — single React instance
- `zustand` — shared global state
- `@microsoft/signalr` — single WebSocket connection pool

## Running

```bash
cd frontend
pnpm install
pnpm dev          # Starts shell on port 3000 + all MFEs

# Or run shell only (MFEs will show loading fallbacks)
cd frontend/apps/shell
pnpm dev
```

## Environment Configuration

| Variable | Local | Staging | Production |
|---|---|---|---|
| `VOICE_MFE_URL` | `http://localhost:3001/mf-manifest.json` | Azure Static Web Apps URL | CDN URL |
| `TRIAGE_MFE_URL` | `http://localhost:3002/mf-manifest.json` | Azure Static Web Apps URL | CDN URL |
| `SCHEDULING_MFE_URL` | `http://localhost:3003/mf-manifest.json` | Azure Static Web Apps URL | CDN URL |
| `POPHEALTH_MFE_URL` | `http://localhost:3004/mf-manifest.json` | Azure Static Web Apps URL | CDN URL |
| `REVENUE_MFE_URL` | `http://localhost:3005/mf-manifest.json` | Azure Static Web Apps URL | CDN URL |
| **API Proxy** | `http://localhost:5000` (via Vite proxy) | Azure API Management | Azure API Management + Front Door |

## Build

```bash
cd frontend/apps/shell
pnpm build        # Output in dist/
```

Production builds are deployed to **Azure Static Web Apps** via the `frontend-deploy.yml` CI/CD pipeline.

## Project Structure

```
shell/
├── src/
│   ├── components/          # Sidebar, TopNav, Dashboard
│   ├── pages/               # Route pages that lazy-load remote MFEs
│   ├── stores/              # zustand global stores
│   └── App.tsx              # Root with React Router
├── vite.config.ts           # Module Federation host config
├── package.json
└── tsconfig.json
```
