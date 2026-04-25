using HealthQCopilot.Domain.Primitives;

namespace HealthQCopilot.Domain.PopulationHealth;

public enum CareGapStatus { Open, Addressed, Closed }

public class CareGap : AggregateRoot<Guid>
{
    public string PatientId { get; private set; } = string.Empty;
    public string MeasureId { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public CareGapStatus Status { get; private set; } = CareGapStatus.Open;
    public DateTime IdentifiedAt { get; private set; }
    public DateTime? ResolvedAt { get; private set; }

    private CareGap() { }

    public static CareGap Create(string patientId, string measureId, string description)
    {
        var gap = new CareGap
        {
            Id = Guid.NewGuid(),
            PatientId = patientId,
            MeasureId = measureId,
            Description = description,
            IdentifiedAt = DateTime.UtcNow
        };
        gap.RaiseDomainEvent(new CareGapIdentified(gap.Id, patientId, measureId, description));
        return gap;
    }

    public void Address()
    {
        Status = CareGapStatus.Addressed;
        RaiseDomainEvent(new CareGapAddressed(Id, PatientId, MeasureId));
    }

    public void Close()
    {
        Status = CareGapStatus.Closed;
        ResolvedAt = DateTime.UtcNow;
        RaiseDomainEvent(new CareGapClosed(Id, PatientId, MeasureId));
    }
}

// ── Domain Events ─────────────────────────────────────────────────────────────

public sealed record CareGapIdentified(
    Guid CareGapId,
    string PatientId,
    string MeasureId,
    string Description) : DomainEvent;

public sealed record CareGapAddressed(
    Guid CareGapId,
    string PatientId,
    string MeasureId) : DomainEvent;

public sealed record CareGapClosed(
    Guid CareGapId,
    string PatientId,
    string MeasureId) : DomainEvent;
