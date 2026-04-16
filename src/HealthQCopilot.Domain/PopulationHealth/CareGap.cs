using HealthQCopilot.Domain.Primitives;

namespace HealthQCopilot.Domain.PopulationHealth;

public enum CareGapStatus { Open, Addressed, Closed }

public class CareGap : Entity<Guid>
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
        return new CareGap
        {
            Id = Guid.NewGuid(),
            PatientId = patientId,
            MeasureId = measureId,
            Description = description,
            IdentifiedAt = DateTime.UtcNow
        };
    }

    public void Address() => Status = CareGapStatus.Addressed;
    public void Close() { Status = CareGapStatus.Closed; ResolvedAt = DateTime.UtcNow; }
}
