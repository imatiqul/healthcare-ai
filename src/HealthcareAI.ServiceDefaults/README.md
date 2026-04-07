# HealthcareAI.ServiceDefaults

Aspire shared project that provides standardized OpenTelemetry, health checks, service discovery, and HTTP resilience configuration for all microservices.

## Why This Project Exists

Every microservice needs the same observability, resilience, and health check setup. Rather than duplicating this configuration 8 times, `ServiceDefaults` provides a single `AddServiceDefaults()` extension method that each service calls in its `Program.cs`.

## Technology Choices

| Technology | Version | Why |
|---|---|---|
| **OpenTelemetry** | 1.12.0 | Industry-standard distributed tracing and metrics — vendor-neutral, works with Azure Monitor, Jaeger, Zipkin, Prometheus |
| **OTel ASP.NET Core Instrumentation** | 1.12.0 | Auto-instruments all incoming HTTP requests with trace spans |
| **OTel HTTP Client Instrumentation** | 1.12.0 | Auto-instruments all outgoing HTTP calls for cross-service trace propagation |
| **OTel Runtime Instrumentation** | 1.12.0 | GC, thread pool, and process metrics for Kubernetes autoscaling |
| **Microsoft.Extensions.Http.Resilience** | 9.0.0 | Standard resilience handler (retry + circuit breaker + timeout) for all HTTP clients |
| **Microsoft.Extensions.ServiceDiscovery** | 9.0.0 | Name-based service resolution — services call each other by logical name, not URLs |

## What `AddServiceDefaults()` Configures

1. **OpenTelemetry** — traces, metrics, and structured logs exported via OTLP
2. **Health Checks** — `/health` (readiness) and `/alive` (liveness) endpoints
3. **Service Discovery** — all `HttpClient` instances resolve service names automatically
4. **HTTP Resilience** — standard resilience handler applied to all outgoing HTTP calls

## Usage

Every microservice calls this in `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();  // ← OTel, health checks, discovery, resilience

// ... service-specific registrations

var app = builder.Build();
app.MapDefaultEndpoints();     // ← /health and /alive
```

## Environment Configuration

| Environment | OTLP Endpoint | Service Discovery |
|---|---|---|
| **Local (Aspire)** | Aspire dashboard collector (auto-configured) | Aspire-based name resolution |
| **Local (Docker Compose)** | Zipkin at `http://localhost:9411` | Manual URLs in appsettings |
| **Staging** | Azure Monitor OTLP endpoint | Kubernetes DNS-based |
| **Production** | Azure Monitor + Prometheus | Kubernetes DNS + Dapr service invocation |

## Health Check Endpoints

| Endpoint | Purpose | Used By |
|---|---|---|
| `GET /health` | Readiness probe — includes all registered checks | Kubernetes readiness probe, load balancer |
| `GET /alive` | Liveness probe — only the "self" check | Kubernetes liveness probe |
