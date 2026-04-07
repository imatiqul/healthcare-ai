using HealthcareAI.Domain.Primitives;

namespace HealthcareAI.Domain.Ocr.Events;

public sealed record DocumentProcessed(
    Guid JobId,
    string? PatientId,
    string FhirDocumentReferenceId) : DomainEvent;
