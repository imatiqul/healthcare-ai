using HealthQCopilot.Domain.Primitives;

namespace HealthQCopilot.Domain.Voice.Events;

public sealed record TranscriptProduced(Guid SessionId, string TranscriptText) : DomainEvent;
