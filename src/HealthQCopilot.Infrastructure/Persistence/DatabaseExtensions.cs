using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace HealthQCopilot.Infrastructure.Persistence;

public static class DatabaseExtensions
{
    public static async Task InitializeDatabaseAsync<TContext>(this IHost host) where TContext : DbContext
    {
        using var scope = host.Services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<TContext>>();
        var db = scope.ServiceProvider.GetRequiredService<TContext>();

        try
        {
            await db.Database.EnsureCreatedAsync();
            logger.LogInformation("Database initialized for {Context}", typeof(TContext).Name);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not initialize database for {Context}, will continue with degraded mode", typeof(TContext).Name);
        }
    }
}
