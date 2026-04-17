using FluentAssertions;
using HealthQCopilot.Domain.Agents;
using Xunit;

namespace HealthQCopilot.Tests.Unit.Domain;

public class DemoSessionTests
{
    [Fact]
    public void Create_ShouldInitializeWithCorrectState()
    {
        var id = Guid.NewGuid();
        var session = DemoSession.Create(id, "Alice", "Contoso", "alice@contoso.com");

        session.Id.Should().Be(id);
        session.ClientName.Should().Be("Alice");
        session.Company.Should().Be("Contoso");
        session.Email.Should().Be("alice@contoso.com");
        session.Status.Should().Be(DemoStatus.InProgress);
        session.CurrentStep.Should().Be(DemoStep.Welcome);
        session.GuideSessionId.Should().NotBeEmpty();
    }

    [Fact]
    public void Create_WithNullEmail_ShouldAllowNull()
    {
        var session = DemoSession.Create(Guid.NewGuid(), "Bob", "Fabrikam", null);

        session.Email.Should().BeNull();
        session.Status.Should().Be(DemoStatus.InProgress);
    }

    [Fact]
    public void AdvanceStep_ShouldProgressThroughAllSteps()
    {
        var session = DemoSession.Create(Guid.NewGuid(), "Alice", "Contoso", null);

        session.CurrentStep.Should().Be(DemoStep.Welcome);

        session.AdvanceStep();
        session.CurrentStep.Should().Be(DemoStep.VoiceIntake);

        session.AdvanceStep();
        session.CurrentStep.Should().Be(DemoStep.AiTriage);

        session.AdvanceStep();
        session.CurrentStep.Should().Be(DemoStep.Scheduling);

        session.AdvanceStep();
        session.CurrentStep.Should().Be(DemoStep.RevenueCycle);

        session.AdvanceStep();
        session.CurrentStep.Should().Be(DemoStep.PopulationHealth);

        session.AdvanceStep();
        session.CurrentStep.Should().Be(DemoStep.Overall);
    }

    [Fact]
    public void AdvanceStep_AtOverall_ShouldNotAdvanceFurther()
    {
        var session = DemoSession.Create(Guid.NewGuid(), "Alice", "Contoso", null);

        // Advance to Overall
        for (int i = 0; i < 7; i++) session.AdvanceStep();

        session.CurrentStep.Should().Be(DemoStep.Overall);

        // Try to advance past Overall
        session.AdvanceStep();
        session.CurrentStep.Should().Be(DemoStep.Overall);
    }

    [Fact]
    public void AdvanceStep_WhenCompleted_ShouldNotAdvance()
    {
        var session = DemoSession.Create(Guid.NewGuid(), "Alice", "Contoso", null);
        session.Complete(8, ["scheduling", "triage"], "Great demo");

        var stepBefore = session.CurrentStep;
        session.AdvanceStep();
        session.CurrentStep.Should().Be(stepBefore);
    }

    [Fact]
    public void AddStepFeedback_ShouldAddToCollection()
    {
        var session = DemoSession.Create(Guid.NewGuid(), "Alice", "Contoso", null);
        session.AdvanceStep(); // VoiceIntake

        session.AddStepFeedback(DemoStep.VoiceIntake, 4, ["accurate", "fast"], "Good experience");

        session.StepFeedbacks.Should().HaveCount(1);
        session.StepFeedbacks[0].Step.Should().Be(DemoStep.VoiceIntake);
        session.StepFeedbacks[0].Rating.Should().Be(4);
        session.StepFeedbacks[0].Tags.Should().Contain("accurate");
        session.StepFeedbacks[0].Comment.Should().Be("Good experience");
    }

    [Fact]
    public void AddStepFeedback_ShouldClampRatingBetween1And5()
    {
        var session = DemoSession.Create(Guid.NewGuid(), "Alice", "Contoso", null);

        session.AddStepFeedback(DemoStep.Welcome, 0, [], null);
        session.StepFeedbacks[0].Rating.Should().Be(1);

        session.AddStepFeedback(DemoStep.Welcome, 10, [], null);
        session.StepFeedbacks[1].Rating.Should().Be(5);
    }

    [Fact]
    public void Complete_ShouldSetCompletedStatusAndOverallFeedback()
    {
        var session = DemoSession.Create(Guid.NewGuid(), "Alice", "Contoso", null);

        session.Complete(9, ["scheduling", "voice"], "Excellent");

        session.Status.Should().Be(DemoStatus.Completed);
        session.CompletedAt.Should().NotBeNull();
        session.OverallFeedback.Should().NotBeNull();
        session.OverallFeedback!.NpsScore.Should().Be(9);
        session.OverallFeedback.FeaturePriorities.Should().Contain("scheduling");
        session.OverallFeedback.Comment.Should().Be("Excellent");
    }

    [Fact]
    public void Complete_ShouldClampNpsScoreBetween0And10()
    {
        var session = DemoSession.Create(Guid.NewGuid(), "Alice", "Contoso", null);
        session.Complete(-1, [], null);

        session.OverallFeedback!.NpsScore.Should().Be(0);
    }

    [Fact]
    public void Abandon_ShouldSetAbandonedStatus()
    {
        var session = DemoSession.Create(Guid.NewGuid(), "Alice", "Contoso", null);

        session.Abandon();

        session.Status.Should().Be(DemoStatus.Abandoned);
        session.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public void Abandon_WhenAlreadyCompleted_ShouldNotChangeStatus()
    {
        var session = DemoSession.Create(Guid.NewGuid(), "Alice", "Contoso", null);
        session.Complete(5, [], null);

        session.Abandon();

        session.Status.Should().Be(DemoStatus.Completed);
    }

    [Fact]
    public void IsExpired_NewSession_ShouldReturnFalse()
    {
        var session = DemoSession.Create(Guid.NewGuid(), "Alice", "Contoso", null);

        session.IsExpired().Should().BeFalse();
    }

    [Fact]
    public void IsExpired_CompletedSession_ShouldReturnFalse()
    {
        var session = DemoSession.Create(Guid.NewGuid(), "Alice", "Contoso", null);
        session.Complete(5, [], null);

        session.IsExpired().Should().BeFalse();
    }
}
