using HealthQCopilot.Domain.Primitives;

namespace HealthQCopilot.Domain.Agents.Events;

public sealed record EscalationRequired(
    Guid WorkflowId,
    string SessionId,
    TriageLevel Level) : DomainEvent;
