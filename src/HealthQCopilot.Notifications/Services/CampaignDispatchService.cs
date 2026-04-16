using HealthQCopilot.Domain.Notifications;
using HealthQCopilot.Notifications.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HealthQCopilot.Notifications.Services;

public sealed class CampaignDispatchService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CampaignDispatchService> _logger;

    public CampaignDispatchService(
        IServiceScopeFactory scopeFactory,
        ILogger<CampaignDispatchService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
                var sender = scope.ServiceProvider.GetRequiredService<INotificationSender>();

                var activeCampaigns = await db.OutreachCampaigns
                    .Where(c => c.Status == CampaignStatus.Active
                        && c.ScheduledAt <= DateTime.UtcNow)
                    .Take(10)
                    .ToListAsync(ct);

                foreach (var campaign in activeCampaigns)
                {
                    var pendingMessages = await db.Messages
                        .Where(m => m.CampaignId == campaign.Id
                            && m.Status == MessageStatus.Pending)
                        .Take(50)
                        .ToListAsync(ct);

                    foreach (var message in pendingMessages)
                    {
                        await sender.SendAsync(message, ct);
                    }

                    await db.SaveChangesAsync(ct);

                    var remaining = await db.Messages
                        .CountAsync(m => m.CampaignId == campaign.Id
                            && m.Status == MessageStatus.Pending, ct);

                    if (remaining == 0)
                    {
                        campaign.Complete();
                        await db.SaveChangesAsync(ct);
                        _logger.LogInformation("Campaign {CampaignId} completed", campaign.Id);
                    }
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Campaign dispatch error");
            }

            await Task.Delay(TimeSpan.FromSeconds(10), ct);
        }
    }
}
