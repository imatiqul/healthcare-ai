using HealthQCopilot.Domain.Primitives;

namespace HealthQCopilot.Domain.Agents.Events;

public sealed record TriageCompleted(
    Guid WorkflowId,
    string SessionId,
    TriageLevel Level,
    string Reasoning) : DomainEvent;
