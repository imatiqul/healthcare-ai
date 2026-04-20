using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace HealthQCopilot.Infrastructure.Billing;

/// <summary>
/// Background service that flushes usage metering events to Azure Marketplace every minute.
/// </summary>
public sealed class UsageMeteringFlushJob(
    IUsageMeteringService meteringService,
    IHttpClientFactory httpClientFactory,
    ILogger<UsageMeteringFlushJob> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));

        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                var http = httpClientFactory.CreateClient("MarketplaceMetering");
                await meteringService.FlushAsync(http, stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "[Billing] Flush job encountered an error");
            }
        }
    }
}
