using HealthcareAI.Domain.Primitives;

namespace HealthcareAI.Domain.Voice.Events;

public sealed record SessionEnded(Guid SessionId, TimeSpan Duration) : DomainEvent;
