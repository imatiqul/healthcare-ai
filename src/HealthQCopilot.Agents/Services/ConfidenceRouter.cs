using System.Diagnostics;
using HealthQCopilot.Infrastructure.Metrics;
using Microsoft.Extensions.Logging;

namespace HealthQCopilot.Agents.Services;

/// <summary>
/// Routes triage decisions by AI confidence score, eliminating unnecessary
/// Human-In-The-Loop (HITL) wait for high-confidence cases and ensuring
/// immediate escalation for low-confidence decisions.
///
/// Clinical rationale:
///   - Auto-escalate (confidence &lt; 0.55): The AI is uncertain. A clinician must
///     review before the patient pathway is determined. Waiting costs &lt;1 min in
///     HITL queue; the alternative (wrong AI path) could be a missed P1.
///   - Standard HITL (0.55–0.88): Confidence is sufficient but warrants review
///     per the platform's default clinical governance policy.
///   - Fast-track (confidence ≥ 0.88): High-confidence AI decision validated by
///     hallucination guard. Proceed to downstream workflow without HITL delay.
///     Audit trail is maintained for retrospective review.
///
/// Thresholds are intentionally conservative (especially fast-track at 0.88)
/// and should be calibrated per-deployment using the ClinicianFeedbackService
/// data to minimize over- and under-escalation rates.
///
/// Metrics emitted:
///   healthq.ai.confidence_routing.total{routing=auto-escalate|standard-hitl|fast-track}
/// </summary>
public sealed class ConfidenceRouter(
    BusinessMetrics metrics,
    ILogger<ConfidenceRouter> logger)
{
    // Calibrated against Phase 27 XAI confidence interval data.
    // Review quarterly via ClinicianFeedbackService HITL override rates.
    private const double AutoEscalateThreshold = 0.55;
    private const double FastTrackThreshold = 0.88;

    public ConfidenceRoutingDecision Route(
        double confidenceScore,
        string patientId,
        Guid workflowId)
    {
        ConfidenceRoutingDecision decision;
        string routingLabel;

        if (confidenceScore < AutoEscalateThreshold)
        {
            decision = ConfidenceRoutingDecision.AutoEscalate;
            routingLabel = "auto-escalate";
            logger.LogWarning(
                "Low AI confidence ({Score:F2}) for workflow {WorkflowId} — auto-escalating to HITL for patient {PatientId}",
                confidenceScore, workflowId, patientId);
        }
        else if (confidenceScore >= FastTrackThreshold)
        {
            decision = ConfidenceRoutingDecision.FastTrack;
            routingLabel = "fast-track";
            logger.LogInformation(
                "High AI confidence ({Score:F2}) for workflow {WorkflowId} — fast-tracking (no HITL wait) for patient {PatientId}",
                confidenceScore, workflowId, patientId);
        }
        else
        {
            decision = ConfidenceRoutingDecision.StandardHitl;
            routingLabel = "standard-hitl";
            logger.LogDebug(
                "Standard AI confidence ({Score:F2}) for workflow {WorkflowId} / patient {PatientId} — queuing for HITL review",
                confidenceScore, workflowId, patientId);
        }

        metrics.ConfidenceRoutingTotal.Add(1,
            new KeyValuePair<string, object?>("routing", routingLabel));

        return decision;
    }
}

/// <summary>
/// Routing outcome from <see cref="ConfidenceRouter"/>.
/// </summary>
public enum ConfidenceRoutingDecision
{
    /// <summary>
    /// Low model confidence — escalate to HITL immediately without waiting
    /// for the standard review queue. Triggers P1 escalation event.
    /// </summary>
    AutoEscalate,

    /// <summary>
    /// Moderate model confidence — route through standard HITL review queue
    /// per the platform's clinical governance policy.
    /// </summary>
    StandardHitl,

    /// <summary>
    /// High model confidence — bypass HITL queue and proceed to downstream
    /// workflow scheduling, coding, and notifications directly.
    /// Decision is still persisted for audit and retrospective review.
    /// </summary>
    FastTrack
}
