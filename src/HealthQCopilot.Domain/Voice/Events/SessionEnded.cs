using HealthQCopilot.Domain.Primitives;

namespace HealthQCopilot.Domain.Voice.Events;

public sealed record SessionEnded(Guid SessionId, TimeSpan Duration) : DomainEvent;
