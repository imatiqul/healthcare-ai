using Microsoft.Extensions.DependencyInjection;

namespace HealthQCopilot.Infrastructure.Caching;

public static class CachingExtensions
{
    public static IServiceCollection AddRedisCaching(this IServiceCollection services, string connectionName)
    {
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = connectionName;
            options.InstanceName = "healthq:";
        });
        services.AddSingleton<ICacheService, RedisCacheService>();
        return services;
    }
}
