using FluentAssertions;
using HealthQCopilot.Domain.Voice;
using Xunit;

namespace HealthQCopilot.Tests.Unit.Domain;

public class AudioStreamTests
{
    [Fact]
    public void EqualStreams_ShouldBeEqual()
    {
        var sessionId = Guid.NewGuid();
        var stream1 = new AudioStream(sessionId, "opus", 16000);
        var stream2 = new AudioStream(sessionId, "opus", 16000);

        stream1.Should().Be(stream2);
    }

    [Fact]
    public void DifferentStreams_ShouldNotBeEqual()
    {
        var stream1 = new AudioStream(Guid.NewGuid(), "opus", 16000);
        var stream2 = new AudioStream(Guid.NewGuid(), "pcm", 44100);

        stream1.Should().NotBe(stream2);
    }
}
