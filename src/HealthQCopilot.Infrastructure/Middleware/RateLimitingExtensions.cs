using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace HealthQCopilot.Infrastructure.Middleware;

public static class RateLimitingExtensions
{
    public static IServiceCollection AddHealthcareRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // Global fixed window: 100 requests per 10 seconds per IP
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 100,
                        Window = TimeSpan.FromSeconds(10),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 5,
                    }));

            // Named policy for tighter limits on triage (AI-intensive)
            options.AddPolicy("triage", ctx =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10,
                        Window = TimeSpan.FromSeconds(30),
                        QueueLimit = 2,
                    }));
        });

        return services;
    }

    public static WebApplication UseHealthcareRateLimiting(this WebApplication app)
    {
        app.UseRateLimiter();
        return app;
    }
}
