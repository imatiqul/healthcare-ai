# AI Engineer Guide

This guide is for engineers extending AI orchestration, triage intelligence, and safety/governance capabilities.

## AI Scope in This Repository

- Clinical triage orchestration in the Agents service.
- Semantic Kernel plugin composition and workflow dispatch.
- RAG and episodic memory support.
- Model governance and drift monitoring.
- Human-in-the-loop (HITL) approval workflow integration with frontend.

## AI Code Map

| Area | Path | What You Will Change |
|---|---|---|
| Service wiring and model dependencies | [src/HealthQCopilot.Agents/Program.cs](../../src/HealthQCopilot.Agents/Program.cs) | DI registration, plugin registration, model endpoint setup |
| Plugin implementations | [src/HealthQCopilot.Agents/Plugins](../../src/HealthQCopilot.Agents/Plugins) | Domain tools for triage, coding, prior auth, care gaps |
| AI orchestration services | [src/HealthQCopilot.Agents/Services](../../src/HealthQCopilot.Agents/Services) | Planning loop, confidence routing, explainability, workflow dispatch |
| RAG services | [src/HealthQCopilot.Agents/Rag](../../src/HealthQCopilot.Agents/Rag) | Knowledge ingestion, retrieval, Qdrant integration |
| Governance and background monitors | [src/HealthQCopilot.Agents/BackgroundServices](../../src/HealthQCopilot.Agents/BackgroundServices) | Drift monitoring and long-running agent tasks |
| API and integration endpoints | [src/HealthQCopilot.Agents/Endpoints](../../src/HealthQCopilot.Agents/Endpoints) | Triage, model governance, demo, guide endpoints |
| HITL UI consumer | [frontend/apps/triage-mfe](../../frontend/apps/triage-mfe) | Human review/approval user experience |
| Realtime stream contract | [frontend/packages/web-pubsub-client/src/index.ts](../../frontend/packages/web-pubsub-client/src/index.ts) | Message envelope consumed by frontend |

## Local Development Workflow

### Full platform mode (recommended)

```bash
dotnet run --project src/HealthQCopilot.AppHost
cd frontend
pnpm dev
```

### AI service-focused mode

```bash
docker compose up -d postgres-agent redis qdrant
cd src/HealthQCopilot.Agents
dapr run --app-id agent-service --app-port 5002 \
  --resources-path ../../infra/dapr/components-local \
  -- dotnet run
```

## Safe Extension Workflow

When adding a new AI capability:

1. Add or extend a plugin under [src/HealthQCopilot.Agents/Plugins](../../src/HealthQCopilot.Agents/Plugins).
2. Register it in [src/HealthQCopilot.Agents/Program.cs](../../src/HealthQCopilot.Agents/Program.cs) within the kernel plugin collection.
3. Add orchestration behavior in [src/HealthQCopilot.Agents/Services](../../src/HealthQCopilot.Agents/Services).
4. Expose only required API surface in [src/HealthQCopilot.Agents/Endpoints](../../src/HealthQCopilot.Agents/Endpoints).
5. Add regression coverage in backend tests and relevant frontend triage tests.

## Governance and Reliability Hotspots

- Prompt and regression checks: `PromptRegressionEvaluator` and `PromptExperimentService`.
- Drift monitoring: `ModelDriftMonitorService`.
- Confidence and guard logic: `ConfidenceRouter` and `HallucinationGuardAgent`.
- Audit and security middleware are wired through shared infrastructure.

## AI Quality Gates to Watch

- [.github/workflows/pr-validation.yml](../../.github/workflows/pr-validation.yml)
- [.github/workflows/microservice-deploy.yml](../../.github/workflows/microservice-deploy.yml)
- [.github/workflows/cloud-e2e-tests.yml](../../.github/workflows/cloud-e2e-tests.yml)

## AI Change Checklist

- New prompts/tools have fallback behavior for low-confidence outputs.
- Triage-level decisions and escalation behavior are deterministic under tests.
- Frontend consumers can parse all streamed message shapes.
- Model behavior changes are covered by cloud E2E triage scenarios.
