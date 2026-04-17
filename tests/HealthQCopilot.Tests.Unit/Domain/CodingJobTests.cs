using FluentAssertions;
using HealthQCopilot.Domain.RevenueCycle;
using Xunit;

namespace HealthQCopilot.Tests.Unit.Domain;

public class CodingJobTests
{
    private static CodingJob CreateJob() =>
        CodingJob.Create("enc-001", "pat-001", "Test Patient", ["J06.9", "R05.9"]);

    [Fact]
    public void Create_ShouldSetPendingStatus()
    {
        var job = CreateJob();

        job.Status.Should().Be(CodingJobStatus.Pending);
        job.PatientName.Should().Be("Test Patient");
        job.SuggestedCodes.Should().HaveCount(2);
        job.ApprovedCodes.Should().BeEmpty();
    }

    [Fact]
    public void Review_WhenPending_ShouldApprove()
    {
        var job = CreateJob();

        var result = job.Review(["J06.9"], "dr-smith");

        result.IsSuccess.Should().BeTrue();
        job.Status.Should().Be(CodingJobStatus.Approved);
        job.ApprovedCodes.Should().ContainSingle().Which.Should().Be("J06.9");
        job.ReviewedBy.Should().Be("dr-smith");
        job.ReviewedAt.Should().NotBeNull();
    }

    [Fact]
    public void Review_WhenAlreadySubmitted_ShouldFail()
    {
        var job = CreateJob();
        job.Review(["J06.9"], "dr-smith");
        job.Submit();

        var result = job.Review(["R05.9"], "dr-jones");

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public void Submit_WhenApproved_ShouldSucceed()
    {
        var job = CreateJob();
        job.Review(["J06.9"], "dr-smith");

        var result = job.Submit();

        result.IsSuccess.Should().BeTrue();
        job.Status.Should().Be(CodingJobStatus.Submitted);
    }

    [Fact]
    public void Submit_WhenPending_ShouldFail()
    {
        var job = CreateJob();

        var result = job.Submit();

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public void MarkInReview_WhenPending_ShouldTransition()
    {
        var job = CreateJob();

        job.MarkInReview();

        job.Status.Should().Be(CodingJobStatus.InReview);
    }

    [Fact]
    public void Review_WhenInReview_ShouldApprove()
    {
        var job = CreateJob();
        job.MarkInReview();

        var result = job.Review(["J06.9", "R05.9"], "dr-smith");

        result.IsSuccess.Should().BeTrue();
        job.Status.Should().Be(CodingJobStatus.Approved);
    }
}
