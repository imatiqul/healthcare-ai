using HealthQCopilot.Domain.Primitives;

namespace HealthQCopilot.Domain.Ocr.Events;

public sealed record DocumentProcessed(
    Guid JobId,
    string? PatientId,
    string FhirDocumentReferenceId) : DomainEvent;
