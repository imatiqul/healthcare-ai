using Microsoft.AspNetCore.Http;
using Serilog.Context;

namespace HealthQCopilot.Infrastructure.Middleware;

/// <summary>
/// Enriches every log entry with <c>TenantId</c>, <c>UserId</c>, and <c>PatientId</c>
/// extracted from the incoming request. This enables compliance-grade log correlation:
/// queries like "show all PHI access for tenant X / patient Y" work reliably in
/// Azure Monitor, Sentinel, and Elastic.
///
/// Must be registered BEFORE authentication middleware so that even auth failures
/// are logged with tenant context.
/// </summary>
public sealed class TenantContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        // ── Tenant ID ─────────────────────────────────────────────────────────
        // Prefer explicit header (API Gateway sets this after APIM policy evaluation)
        // Fall back to the "tid" (tenant ID) claim in the JWT bearer token
        var tenantId = context.Request.Headers["X-Tenant-Id"].FirstOrDefault()
            ?? context.User?.FindFirst("tid")?.Value
            ?? context.User?.FindFirst("http://schemas.microsoft.com/identity/claims/tenantid")?.Value
            ?? "unknown";

        // ── User ID ───────────────────────────────────────────────────────────
        var userId = context.User?.FindFirst("sub")?.Value
            ?? context.User?.FindFirst("oid")?.Value
            ?? context.Request.Headers["X-User-Id"].FirstOrDefault()
            ?? "anonymous";

        // ── Patient ID ────────────────────────────────────────────────────────
        // Extracted from route values (e.g. /patients/{patientId}) or explicit header
        var patientId = context.Request.RouteValues["patientId"]?.ToString()
            ?? context.Request.Headers["X-Patient-Id"].FirstOrDefault()
            ?? "-";

        // Push all context properties so they appear on every log entry in this request
        using (LogContext.PushProperty("TenantId", tenantId))
        using (LogContext.PushProperty("UserId", userId))
        using (LogContext.PushProperty("PatientId", patientId))
        {
            await next(context);
        }
    }
}
