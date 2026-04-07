using System.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace HealthcareAI.Infrastructure.Middleware;

public class PhiAuditMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<PhiAuditMiddleware> _logger;

    private static readonly HashSet<string> PhiPaths =
    [
        "/api/v1/patients",
        "/api/v1/encounters",
        "/api/v1/appointments",
        "/api/v1/fhir"
    ];

    public PhiAuditMiddleware(RequestDelegate next, ILogger<PhiAuditMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        var isPhiAccess = PhiPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase));

        if (isPhiAccess)
        {
            var userId = context.User.FindFirst("oid")?.Value ?? "anonymous";
            var correlationId = Activity.Current?.Id ?? context.TraceIdentifier;

            _logger.LogInformation(
                "PHI_ACCESS: User={UserId} Method={Method} Path={Path} CorrelationId={CorrelationId}",
                userId, context.Request.Method, path, correlationId);
        }

        await _next(context);

        if (isPhiAccess)
        {
            _logger.LogInformation(
                "PHI_ACCESS_COMPLETE: Path={Path} Status={StatusCode}",
                path, context.Response.StatusCode);
        }
    }
}
