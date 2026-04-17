using HealthQCopilot.Domain.Primitives;

namespace HealthQCopilot.Domain.Agents;

public class OverallFeedback : Entity<Guid>
{
    public Guid DemoSessionId { get; private set; }
    public int NpsScore { get; private set; }
    public List<string> FeaturePriorities { get; private set; } = [];
    public string? Comment { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private OverallFeedback() { }

    public static OverallFeedback Create(Guid demoSessionId, int npsScore, List<string> featurePriorities, string? comment)
    {
        return new OverallFeedback
        {
            Id = Guid.NewGuid(),
            DemoSessionId = demoSessionId,
            NpsScore = Math.Clamp(npsScore, 0, 10),
            FeaturePriorities = featurePriorities,
            Comment = comment,
            CreatedAt = DateTime.UtcNow
        };
    }
}
