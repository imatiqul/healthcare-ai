using HealthQCopilot.Domain.Primitives;

namespace HealthQCopilot.Domain.Identity;

/// <summary>
/// Represents an isolated tenant (hospital, clinic, health system) in the HealthQ Copilot
/// multi-tenant SaaS platform. Each tenant has a unique slug and a corresponding
/// Azure App Configuration label used to isolate feature flags and configuration.
/// </summary>
public sealed class TenantConfig : AggregateRoot<Guid>
{
    public Guid TenantId { get; private set; }
    public string OrganisationName { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;          // URL-safe unique name
    public string Locale { get; private set; } = "en";
    public string AppConfigLabel { get; private set; } = string.Empty; // Azure App Config label
    public string DataRegion { get; private set; } = "eastus2";
    public DateTime ProvisionedAt { get; private set; }
    public bool IsActive { get; private set; } = true;

    private TenantConfig() { }

    public static TenantConfig Create(
        Guid tenantId,
        string organisationName,
        string slug,
        string locale,
        string appConfigLabel,
        string dataRegion)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(organisationName);
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);

        return new TenantConfig
        {
            Id = tenantId,
            TenantId = tenantId,
            OrganisationName = organisationName,
            Slug = slug.ToLowerInvariant(),
            Locale = locale,
            AppConfigLabel = appConfigLabel,
            DataRegion = dataRegion,
            ProvisionedAt = DateTime.UtcNow,
            IsActive = true
        };
    }

    public void Deactivate() => IsActive = false;
}
