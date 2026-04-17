using FluentAssertions;
using HealthQCopilot.Domain.RevenueCycle;
using Xunit;

namespace HealthQCopilot.Tests.Unit.Domain;

public class PriorAuthTests
{
    private static PriorAuth CreateAuth() =>
        PriorAuth.Create("pat-001", "Test Patient", "MRI Brain", "70551", "Aetna");

    [Fact]
    public void Create_ShouldSetDraftStatus()
    {
        var auth = CreateAuth();

        auth.Status.Should().Be(PriorAuthStatus.Draft);
        auth.PatientName.Should().Be("Test Patient");
        auth.Procedure.Should().Be("MRI Brain");
        auth.InsurancePayer.Should().Be("Aetna");
    }

    [Fact]
    public void Submit_WhenDraft_ShouldSucceed()
    {
        var auth = CreateAuth();

        var result = auth.Submit();

        result.IsSuccess.Should().BeTrue();
        auth.Status.Should().Be(PriorAuthStatus.Submitted);
        auth.SubmittedAt.Should().NotBeNull();
    }

    [Fact]
    public void Submit_WhenAlreadySubmitted_ShouldFail()
    {
        var auth = CreateAuth();
        auth.Submit();

        var result = auth.Submit();

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public void Approve_WhenSubmitted_ShouldSucceed()
    {
        var auth = CreateAuth();
        auth.Submit();

        var result = auth.Approve();

        result.IsSuccess.Should().BeTrue();
        auth.Status.Should().Be(PriorAuthStatus.Approved);
        auth.ResolvedAt.Should().NotBeNull();
    }

    [Fact]
    public void Approve_WhenDraft_ShouldFail()
    {
        var auth = CreateAuth();

        var result = auth.Approve();

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public void Deny_WhenSubmitted_ShouldSucceed()
    {
        var auth = CreateAuth();
        auth.Submit();

        var result = auth.Deny("Medical necessity not demonstrated");

        result.IsSuccess.Should().BeTrue();
        auth.Status.Should().Be(PriorAuthStatus.Denied);
        auth.DenialReason.Should().Be("Medical necessity not demonstrated");
        auth.ResolvedAt.Should().NotBeNull();
    }

    [Fact]
    public void Deny_WhenDraft_ShouldFail()
    {
        var auth = CreateAuth();

        var result = auth.Deny("Not needed");

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public void MarkUnderReview_WhenSubmitted_ShouldTransition()
    {
        var auth = CreateAuth();
        auth.Submit();

        auth.MarkUnderReview();

        auth.Status.Should().Be(PriorAuthStatus.UnderReview);
    }

    [Fact]
    public void Approve_WhenUnderReview_ShouldSucceed()
    {
        var auth = CreateAuth();
        auth.Submit();
        auth.MarkUnderReview();

        var result = auth.Approve();

        result.IsSuccess.Should().BeTrue();
        auth.Status.Should().Be(PriorAuthStatus.Approved);
    }
}
