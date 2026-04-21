using HealthQCopilot.Infrastructure.Caching;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HealthQCopilot.Infrastructure.AI;

/// <summary>
/// Resolves prompt templates from Azure App Configuration with Redis caching.
///
/// App Configuration key schema:
///   HealthQ:Prompts:{promptKey}:{tenantId}   — tenant-specific override
///   HealthQ:Prompts:{promptKey}:default       — platform-wide override
///
/// Example: tenants with specialty-specific needs set
///   HealthQ:Prompts:triage-system:tenant-oncology = "You are an oncology triage specialist..."
/// in App Config (under the tenant's label) without any code deployment.
///
/// Cache TTL is 10 minutes for tenant overrides, 5 minutes for defaults.
/// This ensures prompt updates propagate within SLA without hammering App Config.
/// </summary>
public sealed class PromptRegistry(
    IConfiguration config,
    ICacheService cache,
    ILogger<PromptRegistry> logger) : IPromptRegistry
{
    private static readonly TimeSpan TenantOverrideTtl = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan DefaultTtl = TimeSpan.FromMinutes(5);

    public async Task<string> GetPromptAsync(
        string promptKey,
        string tenantId,
        string hardcodedDefault,
        CancellationToken ct = default)
    {
        var cacheKey = $"prompt:{tenantId}:{promptKey}";

        // ── Cache hit ─────────────────────────────────────────────────────────
        var cached = await cache.GetAsync<string>(cacheKey, ct);
        if (cached is not null)
            return cached;

        // ── Tenant-specific override ──────────────────────────────────────────
        var tenantConfigKey = $"HealthQ:Prompts:{promptKey}:{tenantId}";
        var tenantPrompt = config[tenantConfigKey];
        if (!string.IsNullOrWhiteSpace(tenantPrompt))
        {
            logger.LogDebug(
                "Using tenant-specific prompt override for {PromptKey}:{TenantId} from App Configuration",
                promptKey, tenantId);
            await cache.SetAsync(cacheKey, tenantPrompt, TenantOverrideTtl, ct);
            return tenantPrompt;
        }

        // ── Platform-wide default override ────────────────────────────────────
        var sharedConfigKey = $"HealthQ:Prompts:{promptKey}:default";
        var sharedPrompt = config[sharedConfigKey];
        if (!string.IsNullOrWhiteSpace(sharedPrompt))
        {
            logger.LogDebug(
                "Using platform-wide default prompt override for {PromptKey} from App Configuration",
                promptKey);
            await cache.SetAsync(cacheKey, sharedPrompt, DefaultTtl, ct);
            return sharedPrompt;
        }

        // ── Hardcoded in-code default ─────────────────────────────────────────
        await cache.SetAsync(cacheKey, hardcodedDefault, DefaultTtl, ct);
        return hardcodedDefault;
    }
}
