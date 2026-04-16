using Azure.Messaging.ServiceBus;
using HealthQCopilot.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace HealthQCopilot.Infrastructure.Messaging;

public class OutboxRelayService<TContext> : BackgroundService where TContext : OutboxDbContext
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ServiceBusSender _sender;
    private readonly ILogger<OutboxRelayService<TContext>> _logger;

    public OutboxRelayService(
        IServiceScopeFactory scopeFactory,
        ServiceBusSender sender,
        ILogger<OutboxRelayService<TContext>> logger)
    {
        _scopeFactory = scopeFactory;
        _sender = sender;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<TContext>();

                var pending = await db.OutboxEvents
                    .Where(e => e.ProcessedAt == null)
                    .OrderBy(e => e.CreatedAt)
                    .Take(50)
                    .ToListAsync(ct);

                if (pending.Count > 0)
                {
                    foreach (var evt in pending)
                    {
                        await _sender.SendMessageAsync(new ServiceBusMessage(evt.Payload)
                        {
                            Subject = evt.Type,
                            MessageId = evt.Id.ToString(),
                            ContentType = "application/json",
                        }, ct);
                        evt.ProcessedAt = DateTime.UtcNow;
                    }
                    await db.SaveChangesAsync(ct);

                    _logger.LogInformation("Relayed {Count} outbox events", pending.Count);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Outbox relay error");
            }

            await Task.Delay(TimeSpan.FromSeconds(2), ct);
        }
    }
}
