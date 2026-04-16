using HealthQCopilot.Domain.Ocr;
using HealthQCopilot.Ocr.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HealthQCopilot.Ocr.Services;

public sealed class OcrProcessingService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OcrProcessingService> _logger;

    public OcrProcessingService(
        IServiceScopeFactory scopeFactory,
        ILogger<OcrProcessingService> logger)
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
                var db = scope.ServiceProvider.GetRequiredService<OcrDbContext>();
                var processor = scope.ServiceProvider.GetRequiredService<IDocumentProcessor>();

                var pendingJobs = await db.OcrJobs
                    .Where(j => j.Status == OcrJobStatus.Queued)
                    .OrderBy(j => j.CreatedAt)
                    .Take(5)
                    .ToListAsync(ct);

                foreach (var job in pendingJobs)
                {
                    job.MarkProcessing();
                    await db.SaveChangesAsync(ct);

                    try
                    {
                        var result = await processor.AnalyzeDocumentAsync(job.DocumentUrl, ct);
                        var fhirDocRefId = $"DocumentReference/{Guid.NewGuid()}";
                        job.Complete(result.ExtractedText, fhirDocRefId);

                        _logger.LogInformation(
                            "OCR job {JobId} completed: {TextLength} chars, {EntityCount} entities",
                            job.Id, result.ExtractedText.Length, result.Entities.Count);
                    }
                    catch (Exception ex)
                    {
                        job.Fail();
                        _logger.LogError(ex, "OCR job {JobId} failed", job.Id);
                    }

                    await db.SaveChangesAsync(ct);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "OCR processing loop error");
            }

            await Task.Delay(TimeSpan.FromSeconds(5), ct);
        }
    }
}
