using HealthQCopilot.Domain.Primitives;

namespace HealthQCopilot.Domain.Agents;

public class DemoInsight : Entity<Guid>
{
    public DateTime GeneratedAt { get; private set; }
    public int SessionsAnalyzed { get; private set; }
    public double AverageNps { get; private set; }
    public string TopStrengths { get; private set; } = string.Empty;
    public string TopWeaknesses { get; private set; } = string.Empty;
    public string Recommendations { get; private set; } = string.Empty;
    public string RawAnalysis { get; private set; } = string.Empty;

    private DemoInsight() { }

    public static DemoInsight Create(
        int sessionsAnalyzed, double averageNps,
        string topStrengths, string topWeaknesses,
        string recommendations, string rawAnalysis)
    {
        return new DemoInsight
        {
            Id = Guid.NewGuid(),
            GeneratedAt = DateTime.UtcNow,
            SessionsAnalyzed = sessionsAnalyzed,
            AverageNps = averageNps,
            TopStrengths = topStrengths,
            TopWeaknesses = topWeaknesses,
            Recommendations = recommendations,
            RawAnalysis = rawAnalysis
        };
    }
}
