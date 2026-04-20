using GreenDonut;
using HealthQCopilot.BFF.Services;

namespace HealthQCopilot.BFF.DataLoaders;

/// <summary>
/// Batches per-patient risk-score lookups that would otherwise cause N+1 REST calls.
///
/// When a GraphQL query resolves a list of triage sessions and each session resolver
/// asks for its patient's risk score, Hot Chocolate groups all outstanding patient IDs
/// into a single batch call dispatched here.
/// </summary>
public sealed class PatientRiskDataLoader(
    PopHealthApiClient popHealth,
    IBatchScheduler scheduler,
    DataLoaderOptions options)
    : BatchDataLoader<string, PatientRiskDto?>(scheduler, options)
{
    protected override async Task<IReadOnlyDictionary<string, PatientRiskDto?>> LoadBatchAsync(
        IReadOnlyList<string> patientIds,
        CancellationToken ct)
    {
        // Fetch all risks in one call, then project to a dictionary keyed by patientId.
        // The REST endpoint returns the full collection; in production replace with
        // a POST /api/v1/population-health/risks/batch accepting a body of IDs.
        var all = await popHealth.GetRisksAsync(ct);
        var lookup = all.ToDictionary(r => r.PatientId, r => (PatientRiskDto?)r);

        return patientIds.ToDictionary(
            id => id,
            id => lookup.TryGetValue(id, out var dto) ? dto : null);
    }
}

/// <summary>
/// Batches care-gap lookups per patient to prevent N+1 REST calls on list views.
/// </summary>
public sealed class CareGapDataLoader(
    PopHealthApiClient popHealth,
    IBatchScheduler scheduler,
    DataLoaderOptions options)
    : BatchDataLoader<string, List<CareGapDto>>(scheduler, options)
{
    protected override async Task<IReadOnlyDictionary<string, List<CareGapDto>>> LoadBatchAsync(
        IReadOnlyList<string> patientIds,
        CancellationToken ct)
    {
        var all = await popHealth.GetCareGapsAsync(ct);

        // Group by patientId; patients with no gaps map to an empty list
        var grouped = all
            .GroupBy(g => g.PatientId)
            .ToDictionary(g => g.Key, g => g.ToList());

        return patientIds.ToDictionary(
            id => id,
            id => grouped.TryGetValue(id, out var gaps) ? gaps : []);
    }
}
