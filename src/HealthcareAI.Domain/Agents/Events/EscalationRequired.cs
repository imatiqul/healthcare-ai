using HealthcareAI.Domain.Primitives;

namespace HealthcareAI.Domain.Agents.Events;

public sealed record EscalationRequired(
    Guid WorkflowId,
    string SessionId,
    TriageLevel Level) : DomainEvent;
