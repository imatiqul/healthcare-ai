using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace HealthQCopilot.Infrastructure.Observability;

public static class HealthCheckExtensions
{
    /// <summary>
    /// Adds a database connectivity health check for the given DbContext.
    /// </summary>
    public static IServiceCollection AddDatabaseHealthCheck<TDbContext>(
        this IServiceCollection services, string name)
        where TDbContext : DbContext
    {
        services.AddHealthChecks()
            .Add(new HealthCheckRegistration(
                name: $"db-{name}",
                factory: sp =>
                {
                    var dbContext = sp.GetRequiredService<TDbContext>();
                    return new DbContextHealthCheck<TDbContext>(dbContext);
                },
                failureStatus: HealthStatus.Unhealthy,
                tags: new[] { "ready", "db" }));

        return services;
    }
}

internal sealed class DbContextHealthCheck<TDbContext> : IHealthCheck
    where TDbContext : DbContext
{
    private readonly TDbContext _dbContext;

    public DbContextHealthCheck(TDbContext dbContext) => _dbContext = dbContext;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken ct = default)
    {
        try
        {
            await _dbContext.Database.CanConnectAsync(ct);
            return HealthCheckResult.Healthy($"{typeof(TDbContext).Name} database is reachable.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy(
                $"{typeof(TDbContext).Name} database unreachable.", ex);
        }
    }
}
