using HealthcareAI.Domain.Primitives;

namespace HealthcareAI.Domain.Notifications;

public enum CampaignType { Reminder, CareGap, FollowUp, Custom }
public enum CampaignStatus { Draft, Active, Completed, Cancelled }

public class OutreachCampaign : AggregateRoot<Guid>
{
    public string Name { get; private set; } = string.Empty;
    public CampaignType Type { get; private set; }
    public CampaignStatus Status { get; private set; } = CampaignStatus.Draft;
    public string TargetCriteria { get; private set; } = string.Empty;
    public DateTime? ScheduledAt { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private OutreachCampaign() { }

    public static OutreachCampaign Create(Guid id, string name, CampaignType type, string criteria)
    {
        return new OutreachCampaign
        {
            Id = id,
            Name = name,
            Type = type,
            TargetCriteria = criteria,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Activate(DateTime scheduledAt)
    {
        Status = CampaignStatus.Active;
        ScheduledAt = scheduledAt;
    }

    public void Complete() => Status = CampaignStatus.Completed;
    public void Cancel() => Status = CampaignStatus.Cancelled;
}
