using HealthQCopilot.Domain.Primitives;

namespace HealthQCopilot.Domain.Agents;

public class StepFeedback : Entity<Guid>
{
    public Guid DemoSessionId { get; private set; }
    public DemoStep Step { get; private set; }
    public int Rating { get; private set; }
    public List<string> Tags { get; private set; } = [];
    public string? Comment { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private StepFeedback() { }

    public static StepFeedback Create(Guid demoSessionId, DemoStep step, int rating, List<string> tags, string? comment)
    {
        return new StepFeedback
        {
            Id = Guid.NewGuid(),
            DemoSessionId = demoSessionId,
            Step = step,
            Rating = Math.Clamp(rating, 1, 5),
            Tags = tags,
            Comment = comment,
            CreatedAt = DateTime.UtcNow
        };
    }
}
