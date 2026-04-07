using HealthcareAI.Domain.Primitives;
using HealthcareAI.Domain.Voice.Events;

namespace HealthcareAI.Domain.Voice;

public enum VoiceSessionStatus
{
    Connecting,
    Live,
    Ended
}

public sealed class VoiceSession : AggregateRoot<Guid>
{
    public string PatientId { get; private set; } = default!;
    public VoiceSessionStatus Status { get; private set; }
    public DateTime StartedAt { get; private set; }
    public DateTime? EndedAt { get; private set; }

    private VoiceSession() { }

    public static VoiceSession Start(string patientId)
    {
        var session = new VoiceSession
        {
            Id = Guid.NewGuid(),
            PatientId = patientId,
            Status = VoiceSessionStatus.Live,
            StartedAt = DateTime.UtcNow
        };

        return session;
    }

    public void ProduceTranscript(string text)
    {
        if (Status != VoiceSessionStatus.Live)
            throw new InvalidOperationException("Cannot produce transcript for a session that is not live.");

        RaiseDomainEvent(new TranscriptProduced(Id, text));
    }

    public void End()
    {
        if (Status == VoiceSessionStatus.Ended)
            throw new InvalidOperationException("Session has already ended.");

        EndedAt = DateTime.UtcNow;
        var duration = EndedAt.Value - StartedAt;
        Status = VoiceSessionStatus.Ended;

        RaiseDomainEvent(new SessionEnded(Id, duration));
    }
}
