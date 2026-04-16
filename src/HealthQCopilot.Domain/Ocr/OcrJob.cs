using HealthQCopilot.Domain.Primitives;
using HealthQCopilot.Domain.Ocr.Events;

namespace HealthQCopilot.Domain.Ocr;

public enum OcrJobStatus { Queued, Processing, Completed, Failed }

public class OcrJob : AggregateRoot<Guid>
{
    public string DocumentUrl { get; private set; } = string.Empty;
    public string? PatientId { get; private set; }
    public OcrJobStatus Status { get; private set; } = OcrJobStatus.Queued;
    public string? ExtractedText { get; private set; }
    public string? FhirDocumentReferenceId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }

    private OcrJob() { }

    public static OcrJob Create(Guid id, string documentUrl, string? patientId)
    {
        return new OcrJob
        {
            Id = id,
            DocumentUrl = documentUrl,
            PatientId = patientId,
            Status = OcrJobStatus.Queued,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void MarkProcessing() => Status = OcrJobStatus.Processing;

    public void Complete(string extractedText, string fhirDocRefId)
    {
        Status = OcrJobStatus.Completed;
        ExtractedText = extractedText;
        FhirDocumentReferenceId = fhirDocRefId;
        CompletedAt = DateTime.UtcNow;
        RaiseDomainEvent(new DocumentProcessed(Id, PatientId, fhirDocRefId));
    }

    public void Fail() => Status = OcrJobStatus.Failed;
}
