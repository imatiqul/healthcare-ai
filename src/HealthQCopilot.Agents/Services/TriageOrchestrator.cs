using HealthQCopilot.Agents.Infrastructure;
using HealthQCopilot.Agents.Plugins;
using HealthQCopilot.Domain.Agents;
using Microsoft.EntityFrameworkCore;
using Microsoft.SemanticKernel;

namespace HealthQCopilot.Agents.Services;

public sealed class TriageOrchestrator
{
    private readonly Kernel _kernel;
    private readonly AgentDbContext _db;
    private readonly WorkflowDispatcher _dispatcher;
    private readonly HallucinationGuardAgent _guard;
    private readonly ILogger<TriageOrchestrator> _logger;

    public TriageOrchestrator(Kernel kernel, AgentDbContext db, WorkflowDispatcher dispatcher,
                               HallucinationGuardAgent guard, ILogger<TriageOrchestrator> logger)
    {
        _kernel     = kernel;
        _db         = db;
        _dispatcher = dispatcher;
        _guard      = guard;
        _logger     = logger;
    }

    public async Task<TriageWorkflow> RunTriageAsync(Guid sessionId, string transcriptText, CancellationToken ct)
    {
        var workflow = TriageWorkflow.Create(Guid.NewGuid(), sessionId.ToString(), transcriptText);
        _db.TriageWorkflows.Add(workflow);

        // Track guard verdict across all code paths (true = safe or rule-based fallback)
        var guardApproved = true;

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
                // ── Hallucination guard before accepting the AI result ─────────
                var guardVerdict = await _guard.EvaluateAsync(result.Reasoning ?? string.Empty, ct);
                guardApproved = guardVerdict.IsSafe;

                if (guardVerdict.IsSafe)
                {
                    workflow.AssignTriage(result.Level, result.Reasoning ?? string.Empty);
                    _logger.LogInformation(
                        "Triage completed for session {SessionId}: {Level} - {Reasoning}",
                        sessionId, result.Level, result.Reasoning);
                    goto triageComplete;
                }

                _logger.LogWarning(
                    "Guard rejected triage reasoning for session {SessionId}. Findings: {Findings}. Falling back to rule-based.",
                    sessionId, string.Join(", ", guardVerdict.Findings));
            }

            // null result or guard-rejected: fall back to rule-based plugin
            var fallback = new TriagePlugin();
            var classification = fallback.ClassifyUrgency(transcriptText);
            workflow.AssignTriage(classification.Level, classification.Reasoning);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Semantic Kernel triage failed for session {SessionId}, using fallback", sessionId);
            var fallback = new TriagePlugin();
            var classification = fallback.ClassifyUrgency(transcriptText);
            workflow.AssignTriage(classification.Level, classification.Reasoning);
            // Rule-based fallback is safe by definition
            guardApproved = true;
        }

        triageComplete:
        var latency = DateTime.UtcNow - start;
        var decision = AgentDecision.Create(workflow.Id, "TriageAgent", transcriptText,
            $"Classified as {workflow.AssignedLevel}: {workflow.AgentReasoning}",
            isGuardApproved: guardApproved, latency);
        _db.AgentDecisions.Add(decision);

        await _db.SaveChangesAsync(ct);

        // Dispatch cross-service workflow events (fire-and-forget with structured error handling)
        _ = Task.Run(() => _dispatcher.DispatchAsync(workflow, CancellationToken.None), CancellationToken.None);

        return workflow;
    }
}
