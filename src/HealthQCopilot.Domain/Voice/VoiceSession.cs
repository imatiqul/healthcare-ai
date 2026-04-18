using HealthQCopilot.Domain.Primitives;
using HealthQCopilot.Domain.Voice.Events;

namespace HealthQCopilot.Domain.Voice;

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
    public string? TranscriptText { get; private set; }

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

        TranscriptText = text;
        RaiseDomainEvent(new TranscriptProduced(Id, text));
    }

    /// <summary>
    /// Appends a partial transcript from an audio chunk to the session's accumulated text.
    /// Does NOT raise a domain event — call <see cref="ProduceTranscript"/> or end the session
    /// to trigger downstream triage.
    /// </summary>
    public void AppendTranscript(string partial)
    {
        if (string.IsNullOrWhiteSpace(partial)) return;
        TranscriptText = string.IsNullOrEmpty(TranscriptText)
            ? partial
            : $"{TranscriptText} {partial}";
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
