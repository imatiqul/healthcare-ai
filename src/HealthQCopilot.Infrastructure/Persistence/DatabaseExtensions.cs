using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace HealthQCopilot.Infrastructure.Persistence;

public static class DatabaseExtensions
{
    /// <summary>
    /// Registers a DbContext with PostgreSQL when a connection string is configured,
    /// or falls back to SQLite for environments without a database server.
    /// </summary>
    public static IServiceCollection AddHealthcareDb<TContext>(
        this IServiceCollection services,
        IConfiguration configuration,
        string connectionStringName,
        params IInterceptor[] interceptors) where TContext : DbContext
    {
        var connectionString = configuration.GetConnectionString(connectionStringName);

        // Build NpgsqlDataSource once outside the lambda to avoid creating
        // a new connection pool per DbContext resolution.
        NpgsqlDataSource? npgsqlDataSource = null;
        if (!string.IsNullOrEmpty(connectionString))
        {
            var dataSourceBuilder = new Npgsql.NpgsqlDataSourceBuilder(connectionString);
            dataSourceBuilder.EnableDynamicJson();
            npgsqlDataSource = dataSourceBuilder.Build();
        }

        services.AddDbContext<TContext>(opt =>
        {
            if (npgsqlDataSource is not null)
            {
                opt.UseNpgsql(npgsqlDataSource, o => o.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(5),
                    errorCodesToAdd: null));
            }
            else
            {
                opt.UseSqlite($"Data Source={typeof(TContext).Name}.db");
            }

            if (interceptors.Length > 0)
            {
                opt.AddInterceptors(interceptors);
            }
        });

        return services;
    }

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

                // EnsureCreatedAsync is a no-op when the database already exists (e.g.
                // created by the primary DbContext). For secondary contexts that share
                // the same database, explicitly create any missing tables.
                if (db is AuditDbContext)
                {
                    await db.Database.ExecuteSqlRawAsync("""
                        CREATE TABLE IF NOT EXISTS phi_audit_logs (
                            id              uuid PRIMARY KEY,
                            user_id         varchar(128) NOT NULL,
                            http_method     varchar(10)  NOT NULL,
                            resource_path   varchar(512) NOT NULL,
                            status_code     integer      NOT NULL,
                            correlation_id  varchar(128),
                            accessed_at     timestamp    NOT NULL
                        )
                        """);
                }
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
