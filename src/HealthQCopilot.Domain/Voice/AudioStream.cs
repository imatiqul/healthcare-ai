using HealthQCopilot.Domain.Primitives;

namespace HealthQCopilot.Domain.Voice;

public sealed class AudioStream : ValueObject
{
    public Guid SessionId { get; }
    public string Format { get; }
    public int SampleRate { get; }

    public AudioStream(Guid sessionId, string format, int sampleRate)
    {
        SessionId = sessionId;
        Format = format;
        SampleRate = sampleRate;
    }

    protected override IEnumerable<object?> GetAtomicValues()
    {
        yield return SessionId;
        yield return Format;
        yield return SampleRate;
    }
}
