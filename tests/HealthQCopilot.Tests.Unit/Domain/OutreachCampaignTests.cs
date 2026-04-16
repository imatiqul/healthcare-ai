using FluentAssertions;
using HealthQCopilot.Domain.Notifications;
using Xunit;

namespace HealthQCopilot.Tests.Unit.Domain;

public class OutreachCampaignTests
{
    [Fact]
    public void Create_ShouldSetDraftStatus()
    {
        var campaign = OutreachCampaign.Create(
            Guid.NewGuid(), "Flu Season Reminder", CampaignType.Reminder, "age > 65");

        campaign.Status.Should().Be(CampaignStatus.Draft);
        campaign.Name.Should().Be("Flu Season Reminder");
        campaign.Type.Should().Be(CampaignType.Reminder);
        campaign.TargetCriteria.Should().Be("age > 65");
    }

    [Fact]
    public void Activate_ShouldSetActiveWithSchedule()
    {
        var campaign = OutreachCampaign.Create(
            Guid.NewGuid(), "Care Gap", CampaignType.CareGap, "missing_a1c");
        var scheduleDate = DateTime.UtcNow.AddDays(7);

        campaign.Activate(scheduleDate);

        campaign.Status.Should().Be(CampaignStatus.Active);
        campaign.ScheduledAt.Should().Be(scheduleDate);
    }

    [Fact]
    public void Complete_ShouldSetCompletedStatus()
    {
        var campaign = OutreachCampaign.Create(
            Guid.NewGuid(), "FollowUp", CampaignType.FollowUp, "post_surgery");
        campaign.Activate(DateTime.UtcNow);

        campaign.Complete();

        campaign.Status.Should().Be(CampaignStatus.Completed);
    }

    [Fact]
    public void Cancel_ShouldSetCancelledStatus()
    {
        var campaign = OutreachCampaign.Create(
            Guid.NewGuid(), "Custom", CampaignType.Custom, "criteria");

        campaign.Cancel();

        campaign.Status.Should().Be(CampaignStatus.Cancelled);
    }
}
