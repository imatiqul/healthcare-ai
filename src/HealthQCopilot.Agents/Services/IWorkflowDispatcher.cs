using HealthQCopilot.Domain.Agents;

namespace HealthQCopilot.Agents.Services;

/// <summary>
/// Abstracts cross-service workflow dispatch for testability.
/// </summary>
public interface IWorkflowDispatcher
{
    Task DispatchAsync(TriageWorkflow workflow, string patientId, CancellationToken ct);
}
