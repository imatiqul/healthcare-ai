namespace HealthQCopilot.Infrastructure.AI;

/// <summary>
/// Resolves system prompt templates from a versioned registry, supporting
/// per-tenant customization via Azure App Configuration.
///
/// Prompt governance benefits:
///   - Tenants with specialty-specific workflows (e.g., oncology, cardiology) can
///     override the default triage / guide prompts without code changes.
///   - Changes are auditable via App Configuration revision history.
///   - Prompts are cached in Redis to avoid per-request Config reads.
/// </summary>
public interface IPromptRegistry
{
    /// <summary>
    /// Returns the effective prompt for <paramref name="promptKey"/>.
    /// Resolution order: tenant-specific override → shared default override → hardcoded default.
    /// </summary>
    /// <param name="promptKey">Logical prompt name (e.g., "triage-system", "guide-system").</param>
    /// <param name="tenantId">Tenant requesting the prompt (drives override lookup).</param>
    /// <param name="hardcodedDefault">The in-code default used when no overrides exist.</param>
    /// <param name="ct">Cancellation token.</param>
    Task<string> GetPromptAsync(string promptKey, string tenantId, string hardcodedDefault, CancellationToken ct = default);
}
