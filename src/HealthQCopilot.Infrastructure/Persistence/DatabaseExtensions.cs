using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace HealthQCopilot.Infrastructure.Persistence;

public static class DatabaseExtensions
{
    /// <summary>
    /// Initializes the database. Uses EF Core migrations when pending migrations exist,
    /// otherwise falls back to EnsureCreated for development/CI environments.
    /// </summary>
    public static async Task InitializeDatabaseAsync<TContext>(this IHost host) where TContext : DbContext
    {
        using var scope = host.Services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<TContext>>();
        var db = scope.ServiceProvider.GetRequiredService<TContext>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var useMigrations = config.GetValue("Database:UseMigrations", false);

        try
        {
            if (useMigrations)
            {
                var pending = await db.Database.GetPendingMigrationsAsync();
                if (pending.Any())
                {
                    logger.LogInformation("Applying {Count} pending migrations for {Context}",
                        pending.Count(), typeof(TContext).Name);
                    await db.Database.MigrateAsync();
                }
                else
                {
                    logger.LogInformation("No pending migrations for {Context}", typeof(TContext).Name);
                }
            }
            else
            {
                await db.Database.EnsureCreatedAsync();
            }

            logger.LogInformation("Database initialized for {Context} (migrations={UseMigrations})",
                typeof(TContext).Name, useMigrations);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not initialize database for {Context}, will continue with degraded mode", typeof(TContext).Name);
        }
    }
}
