using HealthcareAI.Agents.Infrastructure;
using HealthcareAI.Agents.Plugins;
using HealthcareAI.Domain.Agents;
using Microsoft.EntityFrameworkCore;
using Microsoft.SemanticKernel;

namespace HealthcareAI.Agents.Services;

public sealed class TriageOrchestrator
{
    private readonly Kernel _kernel;
    private readonly AgentDbContext _db;
    private readonly ILogger<TriageOrchestrator> _logger;

    public TriageOrchestrator(Kernel kernel, AgentDbContext db, ILogger<TriageOrchestrator> logger)
    {
        _kernel = kernel;
        _db = db;
        _logger = logger;
    }

    public async Task<TriageWorkflow> RunTriageAsync(Guid sessionId, string transcriptText, CancellationToken ct)
    {
        var workflow = TriageWorkflow.Create(Guid.NewGuid(), sessionId.ToString(), transcriptText);
        _db.TriageWorkflows.Add(workflow);

        var start = DateTime.UtcNow;
        try
        {
            var plugin = _kernel.Plugins["Triage"];
            var result = await _kernel.InvokeAsync<TriageClassification>(
                plugin["classify_urgency"],
                new KernelArguments { ["transcriptText"] = transcriptText },
                ct);

            if (result is not null)
            {
                workflow.AssignTriage(result.Level, result.Reasoning);
                _logger.LogInformation(
                    "Triage completed for session {SessionId}: {Level} - {Reasoning}",
                    sessionId, result.Level, result.Reasoning);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Semantic Kernel triage failed for session {SessionId}, using fallback", sessionId);

            var fallback = new TriagePlugin();
            var classification = fallback.ClassifyUrgency(transcriptText);
            workflow.AssignTriage(classification.Level, classification.Reasoning);
        }

        var latency = DateTime.UtcNow - start;
        var decision = AgentDecision.Create(workflow.Id, "TriageAgent", transcriptText,
            $"Classified as {workflow.AssignedLevel}: {workflow.AgentReasoning}",
            isGuardApproved: true, latency);
        _db.AgentDecisions.Add(decision);

        await _db.SaveChangesAsync(ct);
        return workflow;
    }
}
