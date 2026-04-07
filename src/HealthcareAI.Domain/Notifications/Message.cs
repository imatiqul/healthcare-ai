using HealthcareAI.Domain.Primitives;

namespace HealthcareAI.Domain.Notifications;

public enum MessageChannel { Sms, Voice, Email, Push }
public enum MessageStatus { Pending, Sent, Delivered, Failed }

public class Message : Entity<Guid>
{
    public Guid CampaignId { get; private set; }
    public string PatientId { get; private set; } = string.Empty;
    public MessageChannel Channel { get; private set; }
    public string Content { get; private set; } = string.Empty;
    public MessageStatus Status { get; private set; } = MessageStatus.Pending;
    public DateTime CreatedAt { get; private set; }
    public DateTime? SentAt { get; private set; }

    private Message() { }

    public static Message Create(Guid campaignId, string patientId, MessageChannel channel, string content)
    {
        return new Message
        {
            Id = Guid.NewGuid(),
            CampaignId = campaignId,
            PatientId = patientId,
            Channel = channel,
            Content = content,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void MarkSent() { Status = MessageStatus.Sent; SentAt = DateTime.UtcNow; }
    public void MarkDelivered() => Status = MessageStatus.Delivered;
    public void MarkFailed() => Status = MessageStatus.Failed;
}
