# HealthQCopilot.Ocr

Document processing microservice that handles clinical document ingestion, OCR extraction, and structured data production from uploaded medical documents.

## Bounded Context

**Document Processing** — owns the lifecycle of clinical document processing: upload → queue → OCR extraction → structured output → archival. Publishes `DocumentProcessed` events for downstream integration with FHIR records.

## Technology Choices

| Technology | Why |
|---|---|
| **ASP.NET Core Minimal APIs** | REST endpoints for document upload, job status, and result retrieval |
| **Entity Framework Core 9 + Npgsql** | Persists OCR jobs and extracted data to PostgreSQL |
| **Dapr 1.14** | Input binding for Azure Blob Storage (document upload triggers); pub/sub for `DocumentProcessed` events |
| **Azure Blob Storage (via Dapr)** | Scalable document storage — Dapr's input binding abstracts the trigger mechanism |
| **Aspire ServiceDefaults** | Health checks, OTel tracing for document processing pipeline |
| **Transactional Outbox** | Ensures `DocumentProcessed` events are delivered even if processing is long-running |

## Core Aggregates

| Aggregate | Key Behaviors |
|---|---|
| `OcrJob` | Queued → Processing → Complete/Failed lifecycle; tracks extraction progress and results |
| `ClinicalDocument` | Represents the extracted structured output from OCR processing |

## Integration Events

| Event | Published When | Consumers |
|---|---|---|
| `DocumentProcessed` | OCR extraction completes successfully | FHIR Service (creates clinical records) |

## Running

### Local (Aspire — Recommended)
```bash
dotnet run --project src/HealthQCopilot.AppHost
```

### Local (Standalone with Dapr)
```bash
docker compose up -d postgres-ocr redis
cd src/HealthQCopilot.Ocr
dapr run --app-id ocr-service --app-port 5004 \
  --resources-path ../../infra/dapr/components-local \
  -- dotnet run
```

## Environment Configuration

| Setting | Local (Aspire) | Docker Compose | Staging | Production |
|---|---|---|---|---|
| **Port** | Auto-assigned | 5004 | K8s service | K8s service |
| **Database** | `ocr_db` (Aspire-managed) | `Host=localhost;Port=5437` | Key Vault | Key Vault |
| **Redis** | Aspire-managed | `localhost:6379` | Azure Redis | Azure Redis (Premium) |
| **Blob Storage** | Local file system | Local file system | Azure Blob (Standard) | Azure Blob (GRS) |
| **OCR Engine** | Azure AI Document Intelligence (dev) | Azure AI Document Intelligence (dev) | Azure AI (staging) | Azure AI (production) |

## Kubernetes Scaling

This service uses **KEDA autoscaling** with Service Bus queue length trigger and **scale-to-zero** capability — pods scale down to 0 when no documents are being processed.

## Dependencies

- **PostgreSQL** — `ocr_db` for job tracking and extracted data
- **Redis** — job status caching
- **Azure Blob Storage** — document file storage (via Dapr input binding)
- **FHIR Service** — consumes `DocumentProcessed` events
