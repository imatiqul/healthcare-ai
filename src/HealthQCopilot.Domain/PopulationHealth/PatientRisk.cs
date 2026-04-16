using HealthQCopilot.Domain.Primitives;

namespace HealthQCopilot.Domain.PopulationHealth;

public enum RiskLevel { Low, Moderate, High, Critical }

public class PatientRisk : AggregateRoot<Guid>
{
    public string PatientId { get; private set; } = string.Empty;
    public RiskLevel Level { get; private set; }
    public double RiskScore { get; private set; }
    public string ModelVersion { get; private set; } = string.Empty;
    public List<string> RiskFactors { get; private set; } = [];
    public DateTime AssessedAt { get; private set; }

    private PatientRisk() { }

    public static PatientRisk Create(
        string patientId, RiskLevel level, double score, string modelVersion, List<string> factors)
    {
        return new PatientRisk
        {
            Id = Guid.NewGuid(),
            PatientId = patientId,
            Level = level,
            RiskScore = score,
            ModelVersion = modelVersion,
            RiskFactors = factors,
            AssessedAt = DateTime.UtcNow
        };
    }
}
