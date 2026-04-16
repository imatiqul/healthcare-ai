using HealthQCopilot.Domain.Notifications;

namespace HealthQCopilot.Notifications.Services;

public interface INotificationSender
{
    Task<bool> SendAsync(Message message, CancellationToken ct);
}
