using FluentAssertions;
using HealthcareAI.Domain.Voice;
using HealthcareAI.Domain.Voice.Events;
using Xunit;

namespace HealthcareAI.Tests.Unit.Domain;

public class VoiceSessionTests
{
    [Fact]
    public void Start_ShouldCreateLiveSession()
    {
        var session = VoiceSession.Start("patient-123");

        session.Status.Should().Be(VoiceSessionStatus.Live);
        session.PatientId.Should().Be("patient-123");
        session.Id.Should().NotBeEmpty();
        session.StartedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
    }

    [Fact]
    public void ProduceTranscript_WhenLive_ShouldRaiseDomainEvent()
    {
        var session = VoiceSession.Start("patient-123");

        session.ProduceTranscript("Patient reports headache");

        session.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<TranscriptProduced>()
            .Which.TranscriptText.Should().Be("Patient reports headache");
    }

    [Fact]
    public void ProduceTranscript_WhenEnded_ShouldThrow()
    {
        var session = VoiceSession.Start("patient-123");
        session.End();

        var act = () => session.ProduceTranscript("late text");

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void End_ShouldSetStatusToEnded_AndRaiseEvent()
    {
        var session = VoiceSession.Start("patient-123");

        session.End();

        session.Status.Should().Be(VoiceSessionStatus.Ended);
        session.EndedAt.Should().NotBeNull();
        session.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<SessionEnded>();
    }

    [Fact]
    public void End_WhenAlreadyEnded_ShouldThrow()
    {
        var session = VoiceSession.Start("patient-123");
        session.End();

        var act = () => session.End();

        act.Should().Throw<InvalidOperationException>();
    }
}
