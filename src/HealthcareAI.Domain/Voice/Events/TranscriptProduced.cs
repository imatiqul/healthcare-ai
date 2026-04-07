using HealthcareAI.Domain.Primitives;

namespace HealthcareAI.Domain.Voice.Events;

public sealed record TranscriptProduced(Guid SessionId, string TranscriptText) : DomainEvent;
