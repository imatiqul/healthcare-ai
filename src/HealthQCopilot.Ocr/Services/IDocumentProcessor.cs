namespace HealthQCopilot.Ocr.Services;

public interface IDocumentProcessor
{
    Task<DocumentResult> AnalyzeDocumentAsync(string documentUrl, CancellationToken ct);
}

public record DocumentResult(string ExtractedText, IReadOnlyList<HealthEntity> Entities);

public record HealthEntity(string Text, string Category, double Confidence);
