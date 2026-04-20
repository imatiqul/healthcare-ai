namespace HealthQCopilot.Infrastructure.Billing;

/// <summary>
/// Captures a single usage event for a tenant.
/// Persisted to the outbox and forwarded to Azure Marketplace metering API.
/// </summary>
public sealed record UsageEvent(
    Guid TenantId,
    string Dimension,            // matches MeteringDimension constants
    double Quantity,
    DateTimeOffset EffectiveTime);
