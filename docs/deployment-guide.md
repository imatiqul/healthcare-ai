<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# HealthQCopilot — Free Cloud Deployment Guide

## Overview

This guide deploys all 9 HealthQCopilot microservices and 5 micro-frontends using **\$0/month free tiers** across Azure, Railway, Supabase, and Vercel. The full production architecture (AKS + APIM + Azure Service Bus) is preserved for paid scale-up — this guide bootstraps the platform at zero cost.

***

## Free Tier Resource Map

| Component | Production Service | Free Tier Alternative | Limit |
| :-- | :-- | :-- | :-- |
| **Kubernetes (AKS)** | Azure AKS Standard | Railway containers | 500 hrs/mo free |
| **PostgreSQL (×6 DBs)** | Azure PostgreSQL Flexible | Supabase Free | 500MB per project |
| **Redis** | Azure Cache for Redis | Upstash Redis | 10,000 req/day |
| **FHIR Server** | Azure Health Data Services | HAPI FHIR (self-hosted) | Unlimited (open source) |
| **Service Bus** | Azure Service Bus | Azure Service Bus Emulator (local) | Free (local only) |
| **AI Inference** | Azure AI Foundry Phi-4-Medical | GitHub Models (phi-4) | 150 req/day free |
| **Frontend Hosting (×5 MFEs)** | Azure Static Web Apps | Vercel Free | 100GB bandwidth/mo |
| **Auth** | Azure Entra ID | Auth0 Free | 7,500 MAU |
| **Observability** | Azure Monitor + App Insights | Grafana Cloud Free | 10,000 metrics/mo |
| **OCR / Document AI** | Azure Document Intelligence | Azure Free Tier (500 pages/mo) | 500 pages/mo |
| **Vector Search** | Azure AI Search | Qdrant Cloud Free | 1GB, 1 collection |
| **CI/CD** | GitHub Actions (self-hosted) | GitHub Actions Free | 2,000 min/mo |


***

## Prerequisites

```bash
# Install required CLI tools
npm install -g pnpm@9           # Monorepo package manager
curl -fsSL https://get.docker.com | sh  # Docker Engine
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
dotnet sdk install 9.0          # .NET 9 SDK
brew install dapr/tap/dapr-cli  # Dapr CLI (macOS)
# OR
wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash  # Linux

# Verify installations
docker --version       # Docker 26+
dotnet --version       # 9.0+
dapr --version         # 1.14+
pnpm --version         # 9+
```


***

## Step 1 — Clone the Repository

```bash
git clone https://github.com/imatiqul/healthcare-ai
cd healthcare-ai

# Install all frontend dependencies via Turborepo
cd frontend && pnpm install && cd ..
```


***

## Step 2 — Provision Free-Tier Databases (Supabase)

Create **6 separate Supabase projects** (one per bounded context). Each has a 500MB free PostgreSQL instance.

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Create projects via Supabase dashboard at https://supabase.com/dashboard
# Projects needed:
#   healthq-copilot-voice
#   healthq-copilot-agent
#   healthq-copilot-fhir
#   healthq-copilot-scheduling
#   healthq-copilot-notification
#   healthq-copilot-pophealth
```

After creating each project, copy the **Connection String** from:
`Project Settings → Database → Connection String → URI`

Store each in `.env.local`:

> **Security:** Verify `.env.local` is listed in your `.gitignore` before proceeding — it contains database passwords and API tokens that must never be committed.

```env
# .env.local (root of project — never commit this file)
VOICE_DB_CONNECTION=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
AGENT_DB_CONNECTION=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
FHIR_DB_CONNECTION=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
SCHEDULING_DB_CONNECTION=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
NOTIFICATION_DB_CONNECTION=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
POPHEALTH_DB_CONNECTION=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```


***

## Step 3 — Start Local Infrastructure (Docker Compose)

The Docker Compose file emulates all Azure services locally for free:

```bash
# From the project root
docker compose up -d

# Services started:
# - Redis 7 (port 6379)
# - HAPI FHIR R4 Server (port 8080)
# - Qdrant vector DB (port 6333)
# - Azure Service Bus Emulator (port 5672)
# - Dapr Placement (port 50006)
# - Zipkin tracing UI (port 9411)
```

Verify all containers are healthy:

```bash
docker compose ps

# Expected output — all services should show "Up" status:
# healthcare-ai-redis-1              Up   0.0.0.0:6379->6379/tcp
# healthcare-ai-hapi-fhir-1          Up   0.0.0.0:8080->8080/tcp
# healthcare-ai-qdrant-1             Up   0.0.0.0:6333->6333/tcp
# healthcare-ai-servicebus-1         Up   0.0.0.0:5672->5672/tcp
# healthcare-ai-dapr-placement-1     Up   0.0.0.0:50006->50006/tcp
# healthcare-ai-zipkin-1             Up   0.0.0.0:9411->9411/tcp
```

Verify HAPI FHIR is running:

```bash
curl http://localhost:8080/fhir/metadata | jq '.fhirVersion'
# Expected: "4.0.1"
```


***

## Step 4 — Configure Free AI Inference (GitHub Models)

GitHub Models provides free access to `phi-4` (the open-weight equivalent of Phi-4-Medical) at **150 requests/day**:

```bash
# Generate a GitHub Personal Access Token at:
# https://github.com/settings/tokens → Fine-grained → Models: Read

# Add to .env.local
GITHUB_MODELS_TOKEN=ghp_your_token_here
GITHUB_MODELS_ENDPOINT=https://models.inference.ai.azure.com
AI_MODEL_NAME=Phi-4
```

Update `src/HealthQCopilot.Agents/Infrastructure/AiInferenceClient.cs` to use the GitHub Models endpoint:

```csharp
// Free tier: GitHub Models (Phi-4, 150 req/day)
// Upgrade path: Replace endpoint with Azure AI Foundry for production

var client = new AzureOpenAIClient(
    new Uri(config["GITHUB_MODELS_ENDPOINT"]!),
    new ApiKeyCredential(config["GITHUB_MODELS_TOKEN"]!)
);
```


***

## Step 5 — Configure Free Auth (Auth0)

Auth0 Free supports **7,500 Monthly Active Users** — more than enough for early traction:

```bash
# Sign up at https://auth0.com → Create Application → Regular Web Application
# Note your:
#   Domain:       your-tenant.us.auth0.com
#   Client ID:    abc123...
#   Client Secret: xyz789...

# Add to .env.local
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=https://api.healthqcopilot.com
NEXTAUTH_SECRET=generate_with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

Configure Auth0 Application URIs:

- **Allowed Callback URLs:** `http://localhost:3000/api/auth/callback/auth0`
- **Allowed Logout URLs:** `http://localhost:3000`
- **Allowed Web Origins:** `http://localhost:3000`

***

## Step 6 — Run the Microservices Locally (Dapr)

Run each microservice with a Dapr sidecar. Each service gets its own terminal or create a `run-all.sh` file at the project root with the contents below:

```bash
# run-all.sh — run all 9 services simultaneously
#!/bin/bash

services=(
  "voice-service:5001:src/HealthQCopilot.Voice"
  "ai-agent-service:5002:src/HealthQCopilot.Agents"
  "fhir-service:5003:src/HealthQCopilot.Fhir"
  "ocr-service:5004:src/HealthQCopilot.Ocr"
  "scheduling-service:5005:src/HealthQCopilot.Scheduling"
  "notification-service:5006:src/HealthQCopilot.Notifications"
  "pop-health-service:5007:src/HealthQCopilot.PopulationHealth"
  "identity-service:5008:src/HealthQCopilot.Identity"
  "api-gateway:5000:src/HealthQCopilot.Gateway"
)

for entry in "${services[@]}"; do
  IFS=':' read -r name port path <<< "$entry"
  echo "Starting $name on port $port..."
  dapr run \
    --app-id "$name" \
    --app-port "$port" \
    --dapr-http-port "$((port + 1000))" \
    --components-path ./infra/dapr/local \
    -- dotnet run --project "$path" --configuration Debug &
done

wait
```

```bash
# Make executable and run
chmod +x run-all.sh
./run-all.sh

# OR run a single service for development
cd src/HealthQCopilot.Voice
dapr run \
  --app-id voice-service \
  --app-port 5001 \
  --components-path ../../infra/dapr/local \
  -- dotnet run --configuration Debug
```

Verify all services are registered with Dapr:

```bash
dapr list
# Expected output:
# APP ID                 HTTP PORT  GRPC PORT  APP PORT  COMMAND        AGE
# voice-service          3501       50001       5001      dotnet run     1m
# ai-agent-service       3502       50002       5002      dotnet run     1m
# fhir-service           3503       50003       5003      dotnet run     1m
# ... (all 9 services)
```


***

## Step 7 — Run the Micro-Frontends (Vercel Dev / Next.js)

```bash
cd frontend

# Start all 5 MFEs + Shell in parallel via Turborepo
pnpm dev

# Each MFE starts on its own port:
# Shell App        →  http://localhost:3000
# Voice MFE        →  http://localhost:3001
# Triage MFE       →  http://localhost:3002
# Scheduling MFE   →  http://localhost:3003
# Pop. Health MFE  →  http://localhost:3004
# Revenue MFE      →  http://localhost:3005
```

Add MFE remote URLs to `frontend/apps/shell/.env.local`:

```env
VOICE_MFE_URL=http://localhost:3001
TRIAGE_MFE_URL=http://localhost:3002
SCHEDULING_MFE_URL=http://localhost:3003
POPHEALTH_MFE_URL=http://localhost:3004
REVENUE_MFE_URL=http://localhost:3005
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.us.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your_client_id
```

Open `http://localhost:3000` — the full platform is now running locally at \$0 cost.

***

## Step 8 — Deploy Frontends to Vercel (Free)

Vercel Free provides **100GB bandwidth/month** and **unlimited deployments**:

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy each MFE independently (from the frontend/apps directory)
cd frontend/apps/shell && vercel --prod
cd frontend/apps/voice-mfe && vercel --prod
cd frontend/apps/triage-mfe && vercel --prod
cd frontend/apps/scheduling-mfe && vercel --prod
cd frontend/apps/pophealth-mfe && vercel --prod
cd frontend/apps/revenue-mfe && vercel --prod
```

After each deployment, Vercel outputs a production URL (e.g., `https://voice-mfe-abc123.vercel.app`). Update the Shell App environment variables in Vercel Dashboard:

```
VOICE_MFE_URL    = https://voice-mfe-abc123.vercel.app
TRIAGE_MFE_URL   = https://triage-mfe-abc123.vercel.app
SCHEDULING_MFE_URL = https://scheduling-mfe-abc123.vercel.app
POPHEALTH_MFE_URL = https://pophealth-mfe-abc123.vercel.app
REVENUE_MFE_URL  = https://revenue-mfe-abc123.vercel.app
NEXT_PUBLIC_API_URL = https://your-api-gateway-url.railway.app
```


***

## Step 9 — Deploy Backend Services to Railway (Free)

Railway Free gives **500 container hours/month** — enough for a demo/dev environment:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create a new Railway project
railway init

# Deploy each microservice
# (Repeat for each of the 9 services)
cd src/HealthQCopilot.Voice
railway up --service voice-service

cd src/HealthQCopilot.Agents
railway up --service ai-agent-service

cd src/HealthQCopilot.Fhir
railway up --service fhir-service

# ... repeat for all 9 services
```

Set environment variables for each Railway service via the Railway dashboard or CLI:

```bash
railway variables set \
  VOICE_DB_CONNECTION="your_supabase_connection_string" \
  REDIS_CONNECTION="your_upstash_redis_url" \
  AUTH0_DOMAIN="your-tenant.us.auth0.com" \
  AUTH0_AUDIENCE="https://api.healthqcopilot.com" \
  GITHUB_MODELS_TOKEN="your_github_token" \
  ASPNETCORE_ENVIRONMENT="Production"
```


***

## Step 10 — Set Up Free Observability (Grafana Cloud)

Grafana Cloud Free supports **10,000 metrics/month** and **14-day log retention**:

```bash
# Sign up at https://grafana.com/auth/sign-up/create-user
# Create a free stack → Get Prometheus remote_write URL and credentials

# Add to each microservice's environment variables:
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-us-central-0.grafana.net/otlp
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64-encoded credentials>

# View distributed traces at Zipkin (local):
open http://localhost:9411

# View metrics at Grafana Cloud:
open https://your-org.grafana.net
```


***

## Step 11 — Run the Full Test Suite

```bash
# From project root

# Backend unit tests (all 9 services)
dotnet test tests/HealthQCopilot.Tests.Unit \
  --collect:"XPlat Code Coverage" \
  --results-directory ./coverage
# Target: ≥80% coverage gate (CI enforced)

# Backend integration tests (Testcontainers — spins up real PostgreSQL + Redis)
dotnet test tests/HealthQCopilot.Tests.Integration

# Frontend E2E tests (Playwright)
cd frontend
pnpm exec playwright test

# Check coverage report
dotnet tool install -g dotnet-reportgenerator-globaltool
reportgenerator -reports:./coverage/**/coverage.cobertura.xml \
  -targetdir:./coverage/report \
  -reporttypes:Html
open ./coverage/report/index.html
```


***

## Step 12 — GitHub Actions CI/CD (Free Tier)

GitHub Actions Free provides **2,000 minutes/month**. The pipeline runs on every push to `main`:

```bash
# The pipeline is already configured at:
# .github/workflows/microservice-deploy.yml

# It performs 6 quality gates per service:
# Gate 1: dotnet build + dotnet format --verify-no-changes
# Gate 2: Unit tests with ≥80% coverage
# Gate 3: Integration tests (Testcontainers)
# Gate 4: Trivy container scan (blocks on CRITICAL CVEs)
# Gate 5: Build + push Docker image to GitHub Container Registry (ghcr.io — free)
# Gate 6: Deploy to Railway via railway up (requires RAILWAY_TOKEN secret — see Step 9)

# Configure required GitHub Secrets:
# Settings → Secrets and variables → Actions → New repository secret
RAILWAY_TOKEN          # From Railway Dashboard → Account → Tokens
AUTH0_DOMAIN           # Your Auth0 tenant domain
AUTH0_CLIENT_SECRET    # Your Auth0 client secret
GITHUB_MODELS_TOKEN    # Your GitHub Models PAT
```

Trigger your first deployment:

```bash
git add .
git commit -m "feat: initial HealthQCopilot deployment"
git push origin main

# Watch the pipeline at:
# https://github.com/imatiqul/healthcare-ai/actions
```


***

## Free Tier Limits \& Upgrade Triggers

| Metric | Free Tier Ceiling | Upgrade Trigger | Upgrade Path |
| :-- | :-- | :-- | :-- |
| **Concurrent users** | ~50 (Railway 500hr/mo) | >50 concurrent | Railway Starter \$5/mo |
| **Database storage** | 500MB × 6 = 3GB (Supabase) | 80% capacity | Supabase Pro \$25/mo/project |
| **AI requests** | 150/day (GitHub Models) | Going live with patients | Azure AI Foundry pay-per-use |
| **Auth users** | 7,500 MAU (Auth0) | 5,000 MAU | Auth0 Essential \$23/mo |
| **Frontend bandwidth** | 100GB/mo (Vercel) | 80GB/mo | Vercel Pro \$20/mo |
| **Observability** | 10,000 metrics (Grafana) | Production monitoring | Azure Monitor \$0.01/GB |


***

## HIPAA Compliance Note

> ⚠️ **Important:** The free-tier configuration above is suitable for **development and demos only**. Before handling real PHI (Protected Health Information), you must:
> - Sign a **Business Associate Agreement (BAA)** with each cloud provider
> - Supabase Pro (\$25/mo) — BAA available
> - Auth0 Enterprise — BAA available
> - Vercel Enterprise — BAA available
> - Railway — **No BAA available** → upgrade to **Azure Container Apps** for production PHI workloads
> - Enable **PHI encryption** via the `PhiEncryptedString` value objects already built into the codebase
> - Activate **audit logging** via `PhiAuditMiddleware` in every FHIR-touching service

***

## Quick Reference — All Local URLs

| Service | URL | Purpose |
| :-- | :-- | :-- |
| Shell App | http://localhost:3000 | Main physician dashboard |
| Voice MFE | http://localhost:3001 | Ambient scribe + live transcript |
| Triage MFE | http://localhost:3002 | AI triage agent trace viewer |
| Scheduling MFE | http://localhost:3003 | Appointment calendar |
| Pop. Health MFE | http://localhost:3004 | Risk panel + care gaps |
| Revenue MFE | http://localhost:3005 | ICD-10 queue + RCM |
| HAPI FHIR Server | http://localhost:8080/fhir | FHIR R4 API |
| Zipkin Tracing | http://localhost:9411 | Distributed trace viewer |
| API Gateway | http://localhost:5000 | Backend entry point |
| Dapr Dashboard | http://localhost:8081 | Service mesh status |


***

*HealthQCopilot Deployment Guide — Free Cloud Edition v1.0 | April 2026*

