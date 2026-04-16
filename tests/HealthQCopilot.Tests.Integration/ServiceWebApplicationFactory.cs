using HealthQCopilot.Tests.Integration.Fixtures;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HealthQCopilot.Tests.Integration;

public class ServiceWebApplicationFactory<TProgram, TDbContext> : WebApplicationFactory<TProgram>
    where TProgram : class
    where TDbContext : DbContext
{
    private readonly PostgresFixture _postgres;

    public ServiceWebApplicationFactory(PostgresFixture postgres)
    {
        _postgres = postgres;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove existing DbContext registration
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<TDbContext>));
            if (descriptor != null) services.Remove(descriptor);

            // Remove hosted services that require external dependencies (Service Bus, etc.)
            services.RemoveAll(typeof(Microsoft.Extensions.Hosting.IHostedService));

            // Add test DbContext using Testcontainers Postgres
            services.AddDbContext<TDbContext>(options =>
                options.UseNpgsql(_postgres.ConnectionString));

            // Ensure database is created
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<TDbContext>();
            db.Database.EnsureCreated();
        });

        builder.UseEnvironment("Testing");
    }
}

internal static class ServiceCollectionExtensions
{
    public static void RemoveAll(this IServiceCollection services, Type serviceType)
    {
        var descriptors = services.Where(d => d.ServiceType == serviceType).ToList();
        foreach (var d in descriptors) services.Remove(d);
    }
}
