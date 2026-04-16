using FluentAssertions;
using HealthQCopilot.Domain.Agents;
using HealthQCopilot.Domain.Agents.Events;
using Xunit;

namespace HealthQCopilot.Tests.Unit.Domain;

public class TriageWorkflowTests
{
    [Fact]
    public void Create_ShouldSetProcessingStatus()
    {
        var workflow = TriageWorkflow.Create(Guid.NewGuid(), "session-1", "Patient has chest pain");

        workflow.Status.Should().Be(WorkflowStatus.Processing);
        workflow.SessionId.Should().Be("session-1");
        workflow.TranscriptText.Should().Be("Patient has chest pain");
    }

    [Fact]
    public void AssignTriage_P1_ShouldRequireHumanReview()
    {
        var workflow = TriageWorkflow.Create(Guid.NewGuid(), "session-1", "transcript");

        workflow.AssignTriage(TriageLevel.P1_Immediate, "Chest pain indicators");

        workflow.Status.Should().Be(WorkflowStatus.AwaitingHumanReview);
        workflow.AssignedLevel.Should().Be(TriageLevel.P1_Immediate);
        workflow.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<EscalationRequired>();
    }

    [Fact]
    public void AssignTriage_P3_ShouldComplete()
    {
        var workflow = TriageWorkflow.Create(Guid.NewGuid(), "session-1", "transcript");

        workflow.AssignTriage(TriageLevel.P3_Standard, "Routine checkup");

        workflow.Status.Should().Be(WorkflowStatus.Completed);
        workflow.CompletedAt.Should().NotBeNull();
        workflow.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<TriageCompleted>();
    }

    [Fact]
    public void ApproveEscalation_ShouldCompleteWorkflow()
    {
        var workflow = TriageWorkflow.Create(Guid.NewGuid(), "session-1", "transcript");
        workflow.AssignTriage(TriageLevel.P1_Immediate, "Critical");

        workflow.ApproveEscalation();

        workflow.Status.Should().Be(WorkflowStatus.Completed);
        workflow.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public void Escalate_ShouldSetEscalatedStatus()
    {
        var workflow = TriageWorkflow.Create(Guid.NewGuid(), "session-1", "transcript");

        workflow.Escalate();

        workflow.Status.Should().Be(WorkflowStatus.Escalated);
    }
}
