using HealthcareAI.Domain.Primitives;

namespace HealthcareAI.Domain.Agents.Events;

public sealed record TriageCompleted(
    Guid WorkflowId,
    string SessionId,
    TriageLevel Level,
    string Reasoning) : DomainEvent;
