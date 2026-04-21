using System.Text.Json;
using HealthQCopilot.Infrastructure.Metrics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace HealthQCopilot.Infrastructure.Middleware;

/// <summary>
/// Prevents duplicate execution of state-changing POST requests in distributed healthcare workflows.
///
/// Problem: Mobile clients on unreliable networks (clinical bedside devices, telehealth) frequently
/// retry failed POST requests. Without idempotency, a triage session could be created twice,
/// causing duplicate AI decisions, duplicate insurance coding jobs, and double-billing events.
///
/// Solution: Clients include <c>X-Idempotency-Key</c> (UUID v4) per logical operation.
/// The first successful response (2xx) is stored in Redis for 24 hours keyed by
/// HTTP method + path + idempotency key. Subsequent identical requests receive the
/// cached response instantly without re-executing business logic.
///
/// Applied to: POST /api/v1/agents/triage, /voice/sessions, /agents/coding/code-encounter,
///             /scheduling/bookings, /revenue/coding-jobs, /notifications/campaigns.
///
/// HIPAA note: The response cache contains clinical data — Redis must be encrypted-at-rest
/// (Azure Cache for Redis with data-at-rest encryption enabled).
/// </summary>
public sealed class IdempotencyMiddleware(
    RequestDelegate next,
    IDistributedCache cache,
    BusinessMetrics metrics,
    ILogger<IdempotencyMiddleware> logger)
{
    private const string HeaderName = "X-Idempotency-Key";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(24);

    private static readonly HashSet<string> IdempotentPaths =
    [
        "/api/v1/agents/triage",
        "/api/v1/agents/coding/code-encounter",
        "/api/v1/voice/sessions",
        "/api/v1/scheduling/bookings",
        "/api/v1/revenue/coding-jobs",
        "/api/v1/revenue/prior-auths",
        "/api/v1/notifications/campaigns"
    ];

    public async Task InvokeAsync(HttpContext context)
    {
        // Only apply to POST requests on idempotency-protected paths
        if (!context.Request.Method.Equals(HttpMethods.Post, StringComparison.OrdinalIgnoreCase)
            || !IsProtectedPath(context.Request.Path)
            || !context.Request.Headers.TryGetValue(HeaderName, out var keyHeader)
            || string.IsNullOrWhiteSpace(keyHeader))
        {
            await next(context);
            return;
        }

        var cacheKey = BuildCacheKey(context.Request, keyHeader!);

        // ── Cache hit: return stored response ─────────────────────────────────
        var cachedBytes = await cache.GetAsync(cacheKey, context.RequestAborted);
        if (cachedBytes is { Length: > 0 })
        {
            var entry = JsonSerializer.Deserialize<IdempotencyEntry>(cachedBytes);
            if (entry is not null)
            {
                metrics.IdempotencyHitsTotal.Add(1,
                    new KeyValuePair<string, object?>("path", context.Request.Path.Value));
                logger.LogDebug(
                    "Idempotency cache hit for key {Key} on {Path} — returning cached HTTP {StatusCode}",
                    keyHeader, context.Request.Path.Value, entry.StatusCode);

                context.Response.StatusCode = entry.StatusCode;
                context.Response.ContentType = entry.ContentType ?? "application/json";
                await context.Response.WriteAsync(entry.ResponseBody, context.RequestAborted);
                return;
            }
        }

        // ── Cache miss: execute and capture response ───────────────────────────
        var originalBody = context.Response.Body;
        using var buffer = new MemoryStream();
        context.Response.Body = buffer;

        await next(context);

        buffer.Seek(0, SeekOrigin.Begin);
        var responseBody = await new StreamReader(buffer).ReadToEndAsync(context.RequestAborted);

        // Flush buffered response to actual client
        buffer.Seek(0, SeekOrigin.Begin);
        context.Response.Body = originalBody;
        await buffer.CopyToAsync(originalBody, context.RequestAborted);

        // Only cache successful responses — transient errors should be retried
        if (context.Response.StatusCode is >= 200 and < 300)
        {
            var entry = new IdempotencyEntry(
                context.Response.StatusCode,
                context.Response.ContentType,
                responseBody);

            var entryBytes = JsonSerializer.SerializeToUtf8Bytes(entry);
            await cache.SetAsync(cacheKey, entryBytes,
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = CacheDuration
                },
                CancellationToken.None); // Do not cancel the cache write when request ends
        }
    }

    private static bool IsProtectedPath(PathString path)
        => IdempotentPaths.Any(p => path.Value?.StartsWith(p, StringComparison.OrdinalIgnoreCase) == true);

    private static string BuildCacheKey(HttpRequest request, string idempotencyKey)
        // Namespace by method + path to prevent cross-endpoint key collisions
        => $"idmp:{request.Method}:{request.Path.Value}:{idempotencyKey}";

    private sealed record IdempotencyEntry(int StatusCode, string? ContentType, string ResponseBody);
}
