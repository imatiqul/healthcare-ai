using Azure;
using Azure.AI.DocumentIntelligence;

namespace HealthQCopilot.Ocr.Services;

public sealed class AzureDocumentProcessor : IDocumentProcessor
{
    private readonly IConfiguration _config;
    private readonly ILogger<AzureDocumentProcessor> _logger;

    public AzureDocumentProcessor(IConfiguration config, ILogger<AzureDocumentProcessor> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<DocumentResult> AnalyzeDocumentAsync(string documentUrl, CancellationToken ct)
    {
        var endpoint = _config["AzureDocIntelligence:Endpoint"];
        var key = _config["AzureDocIntelligence:Key"];

        if (string.IsNullOrEmpty(endpoint) || string.IsNullOrEmpty(key))
        {
            _logger.LogWarning("Azure Document Intelligence not configured; returning placeholder");
            return new DocumentResult(
                $"[Placeholder OCR text for document: {documentUrl}]",
                []);
        }

        var client = new DocumentIntelligenceClient(
            new Uri(endpoint), new AzureKeyCredential(key));

        var content = BinaryData.FromObjectAsJson(new { urlSource = documentUrl });
        var operation = await client.AnalyzeDocumentAsync(
            WaitUntil.Completed, "prebuilt-read", content, cancellationToken: ct);

        var result = operation.Value;

        var extractedText = string.Join("\n",
            result.Pages.SelectMany(p => p.Lines).Select(l => l.Content));

        var entities = new List<HealthEntity>();
        if (result.Documents is not null)
        {
            entities = result.Documents
                .SelectMany(d => d.Fields)
                .Select(f => new HealthEntity(
                    f.Value.Content ?? f.Key,
                    f.Key,
                    f.Value.Confidence ?? 0))
                .ToList();
        }

        _logger.LogInformation(
            "Document analyzed: {PageCount} pages, {EntityCount} entities extracted",
            result.Pages.Count, entities.Count);

        return new DocumentResult(extractedText, entities);
    }
}
