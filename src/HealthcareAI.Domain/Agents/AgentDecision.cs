using HealthcareAI.Domain.Primitives;

namespace HealthcareAI.Domain.Agents;

public class AgentDecision : Entity<Guid>
{
    public Guid WorkflowId { get; private set; }
    public string AgentName { get; private set; } = string.Empty;
    public string Input { get; private set; } = string.Empty;
    public string Output { get; private set; } = string.Empty;
    public bool IsGuardApproved { get; private set; }
    public TimeSpan Latency { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private AgentDecision() { }

    public static AgentDecision Create(
        Guid workflowId, string agentName, string input, string output,
        bool isGuardApproved, TimeSpan latency)
    {
        return new AgentDecision
        {
            Id = Guid.NewGuid(),
            WorkflowId = workflowId,
            AgentName = agentName,
            Input = input,
            Output = output,
            IsGuardApproved = isGuardApproved,
            Latency = latency,
            CreatedAt = DateTime.UtcNow
        };
    }
}
