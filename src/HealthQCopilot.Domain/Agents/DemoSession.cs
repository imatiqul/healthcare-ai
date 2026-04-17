using HealthQCopilot.Domain.Primitives;

namespace HealthQCopilot.Domain.Agents;

public enum DemoStatus
{
    InProgress,
    Completed,
    Abandoned
}

public enum DemoStep
{
    Welcome = 0,
    VoiceIntake = 1,
    AiTriage = 2,
    Scheduling = 3,
    RevenueCycle = 4,
    PopulationHealth = 5,
    Overall = 6
}

public class DemoSession : AggregateRoot<Guid>
{
    public string ClientName { get; private set; } = string.Empty;
    public string Company { get; private set; } = string.Empty;
    public string? Email { get; private set; }
    public DemoStatus Status { get; private set; } = DemoStatus.InProgress;
    public DemoStep CurrentStep { get; private set; } = DemoStep.Welcome;
    public DateTime StartedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public Guid? GuideSessionId { get; private set; }

    private readonly List<StepFeedback> _stepFeedbacks = [];
    public IReadOnlyList<StepFeedback> StepFeedbacks => _stepFeedbacks.AsReadOnly();

    public OverallFeedback? OverallFeedback { get; private set; }

    private DemoSession() { }

    public static DemoSession Create(Guid id, string clientName, string company, string? email)
    {
        return new DemoSession
        {
            Id = id,
            ClientName = clientName,
            Company = company,
            Email = email,
            Status = DemoStatus.InProgress,
            CurrentStep = DemoStep.Welcome,
            StartedAt = DateTime.UtcNow,
            GuideSessionId = Guid.NewGuid()
        };
    }

    public void AdvanceStep()
    {
        if (Status != DemoStatus.InProgress) return;
        if (CurrentStep < DemoStep.Overall)
            CurrentStep = (DemoStep)((int)CurrentStep + 1);
    }

    public void AddStepFeedback(DemoStep step, int rating, List<string> tags, string? comment)
    {
        var feedback = StepFeedback.Create(Id, step, rating, tags, comment);
        _stepFeedbacks.Add(feedback);
    }

    public void Complete(int npsScore, List<string> featurePriorities, string? comment)
    {
        Status = DemoStatus.Completed;
        CompletedAt = DateTime.UtcNow;
        OverallFeedback = OverallFeedback.Create(Id, npsScore, featurePriorities, comment);
    }

    public void Abandon()
    {
        if (Status == DemoStatus.InProgress)
        {
            Status = DemoStatus.Abandoned;
            CompletedAt = DateTime.UtcNow;
        }
    }

    public bool IsExpired() => Status == DemoStatus.InProgress
        && DateTime.UtcNow - StartedAt > TimeSpan.FromMinutes(30);
}
