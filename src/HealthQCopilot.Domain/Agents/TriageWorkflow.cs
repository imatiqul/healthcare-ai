using HealthQCopilot.Domain.Primitives;
using HealthQCopilot.Domain.Agents.Events;

namespace HealthQCopilot.Domain.Agents;

public enum TriageLevel
{
    P1_Immediate,
    P2_Urgent,
    P3_Standard,
    P4_NonUrgent
}

public enum WorkflowStatus
{
    Pending,
    Processing,
    AwaitingHumanReview,
    Completed,
    Escalated,
    Failed,
    Rejected
}

public enum WorkflowStepStatus
{
    NotStarted,
    Pending,
    InProgress,
    Completed,
    NeedsAttention,
    Failed,
    Skipped
}

public class TriageWorkflow : AggregateRoot<Guid>
{
    public string SessionId { get; private set; } = string.Empty;
    public string PatientId { get; private set; } = string.Empty;
    public string? PatientName { get; private set; }
    public string TranscriptText { get; private set; } = string.Empty;
    public TriageLevel? AssignedLevel { get; private set; }
    public WorkflowStatus Status { get; private set; } = WorkflowStatus.Pending;
    public string? AgentReasoning { get; private set; }
    public string? ApprovedBy { get; private set; }
    public string? ApprovalNote { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public DateTime LastActivityAt { get; private set; }
    public DateTime? ApprovedAt { get; private set; }
    public DateTime? HumanReviewDueAt { get; private set; }
    public DateTime? BookedAt { get; private set; }
    public DateTime? WaitlistQueuedAt { get; private set; }
    public string? CurrentPractitionerId { get; private set; }
    public string? CurrentSlotId { get; private set; }
    public string? BookingId { get; private set; }
    public bool RequiresAttention { get; private set; }
    public string? LatestExceptionCode { get; private set; }
    public string? LatestExceptionMessage { get; private set; }
    public WorkflowStepStatus EncounterStatus { get; private set; } = WorkflowStepStatus.NotStarted;
    public WorkflowStepStatus RevenueStatus { get; private set; } = WorkflowStepStatus.NotStarted;
    public WorkflowStepStatus SchedulingStatus { get; private set; } = WorkflowStepStatus.NotStarted;
    public WorkflowStepStatus NotificationStatus { get; private set; } = WorkflowStepStatus.NotStarted;

    private TriageWorkflow() { }

    public static TriageWorkflow Create(Guid id, string sessionId, string transcriptText)
        => Create(id, sessionId, transcriptText, sessionId);

    public static TriageWorkflow Create(Guid id, string sessionId, string transcriptText, string patientId, string? patientName = null)
    {
        var now = DateTime.UtcNow;
        var workflow = new TriageWorkflow
        {
            Id = id,
            SessionId = sessionId,
            PatientId = string.IsNullOrWhiteSpace(patientId) ? sessionId : patientId.Trim(),
            PatientName = string.IsNullOrWhiteSpace(patientName) ? null : patientName.Trim(),
            TranscriptText = transcriptText,
            Status = WorkflowStatus.Processing,
            CreatedAt = now,
            LastActivityAt = now
        };
        return workflow;
    }

    public void AssignTriage(TriageLevel level, string reasoning)
    {
        AssignedLevel = level;
        AgentReasoning = reasoning;
        RevenueStatus = WorkflowStepStatus.Pending;
        EncounterStatus = WorkflowStepStatus.Pending;
        SchedulingStatus = WorkflowStepStatus.Pending;
        Touch();

        if (level == TriageLevel.P1_Immediate || level == TriageLevel.P2_Urgent)
        {
            Status = WorkflowStatus.AwaitingHumanReview;
            HumanReviewDueAt = DateTime.UtcNow.Add(level == TriageLevel.P1_Immediate
                ? TimeSpan.FromMinutes(15)
                : TimeSpan.FromHours(1));
            RequiresAttention = true;
            LatestExceptionCode = "HUMAN_REVIEW_REQUIRED";
            LatestExceptionMessage = level == TriageLevel.P1_Immediate
                ? "Immediate clinician review is required before booking can continue."
                : "Urgent clinician review is required before booking can continue.";
            NotificationStatus = WorkflowStepStatus.Pending;
            RaiseDomainEvent(new EscalationRequired(Id, SessionId, level));
        }
        else
        {
            Status = WorkflowStatus.Completed;
            CompletedAt = DateTime.UtcNow;
            RequiresAttention = false;
            HumanReviewDueAt = null;
            LatestExceptionCode = null;
            LatestExceptionMessage = null;
            NotificationStatus = WorkflowStepStatus.NotStarted;
            RaiseDomainEvent(new TriageCompleted(Id, SessionId, level, reasoning));
        }
    }

    public void ApproveEscalation(string? approvedBy = null, string? approvalNote = null)
    {
        Status = WorkflowStatus.Completed;
        CompletedAt = DateTime.UtcNow;
        ApprovedAt = DateTime.UtcNow;
        ApprovedBy = string.IsNullOrWhiteSpace(approvedBy) ? ApprovedBy ?? "current-user" : approvedBy.Trim();
        ApprovalNote = string.IsNullOrWhiteSpace(approvalNote) ? ApprovalNote : approvalNote.Trim();
        HumanReviewDueAt = null;
        SchedulingStatus = SchedulingStatus == WorkflowStepStatus.NotStarted
            ? WorkflowStepStatus.Pending
            : SchedulingStatus;
        ClearException();
        RaiseDomainEvent(new TriageCompleted(Id, SessionId, AssignedLevel!.Value, AgentReasoning!));
    }

    public void Escalate()
    {
        if (Status == WorkflowStatus.Escalated) return;
        Status = WorkflowStatus.Escalated;
        HumanReviewDueAt ??= DateTime.UtcNow.AddMinutes(15);
        MarkAttention("ESCALATED", "Workflow confidence was too low and requires urgent clinician review.");
        RaiseDomainEvent(new EscalationRequired(Id, SessionId, AssignedLevel ?? TriageLevel.P1_Immediate));
    }

    public void Fail(string reason)
    {
        Status = WorkflowStatus.Failed;
        AgentReasoning = reason;
        MarkAttention("WORKFLOW_FAILED", reason);
    }

    public void Reject(string reason)
    {
        if (Status != WorkflowStatus.AwaitingHumanReview)
            return;
        Status = WorkflowStatus.Rejected;
        AgentReasoning = $"[REJECTED] {reason}";
        MarkAttention("TRIAGE_REJECTED", reason);
    }

    public void UpdatePatientContext(string patientId, string? patientName = null)
    {
        if (!string.IsNullOrWhiteSpace(patientId))
            PatientId = patientId.Trim();
        if (!string.IsNullOrWhiteSpace(patientName))
            PatientName = patientName.Trim();
        Touch();
    }

    public void BeginRevenueDispatch()
    {
        RevenueStatus = WorkflowStepStatus.InProgress;
        Touch();
    }

    public void CompleteRevenueDispatch()
    {
        RevenueStatus = WorkflowStepStatus.Completed;
        ClearExceptionIfMatches("REVENUE_DISPATCH_FAILED");
        Touch();
    }

    public void FailRevenueDispatch(string message)
    {
        RevenueStatus = WorkflowStepStatus.Failed;
        MarkAttention("REVENUE_DISPATCH_FAILED", message);
    }

    public void BeginEncounterDispatch()
    {
        EncounterStatus = WorkflowStepStatus.InProgress;
        Touch();
    }

    public void CompleteEncounterDispatch()
    {
        EncounterStatus = WorkflowStepStatus.Completed;
        ClearExceptionIfMatches("ENCOUNTER_DISPATCH_FAILED");
        Touch();
    }

    public void FailEncounterDispatch(string message)
    {
        EncounterStatus = WorkflowStepStatus.Failed;
        MarkAttention("ENCOUNTER_DISPATCH_FAILED", message);
    }

    public void BeginNotificationDispatch()
    {
        NotificationStatus = WorkflowStepStatus.InProgress;
        Touch();
    }

    public void CompleteNotificationDispatch()
    {
        NotificationStatus = WorkflowStepStatus.Completed;
        ClearExceptionIfMatches("NOTIFICATION_DISPATCH_FAILED");
        Touch();
    }

    public void FailNotificationDispatch(string message)
    {
        NotificationStatus = WorkflowStepStatus.Failed;
        MarkAttention("NOTIFICATION_DISPATCH_FAILED", message);
    }

    public void BeginScheduling(string? slotId = null, string? practitionerId = null)
    {
        SchedulingStatus = WorkflowStepStatus.InProgress;
        if (!string.IsNullOrWhiteSpace(slotId))
            CurrentSlotId = slotId.Trim();
        if (!string.IsNullOrWhiteSpace(practitionerId))
            CurrentPractitionerId = practitionerId.Trim();
        Touch();
    }

    public void MarkBooked(string? bookingId, string? slotId, string? practitionerId)
    {
        SchedulingStatus = WorkflowStepStatus.Completed;
        BookingId = string.IsNullOrWhiteSpace(bookingId) ? BookingId : bookingId.Trim();
        CurrentSlotId = string.IsNullOrWhiteSpace(slotId) ? CurrentSlotId : slotId.Trim();
        CurrentPractitionerId = string.IsNullOrWhiteSpace(practitionerId) ? CurrentPractitionerId : practitionerId.Trim();
        BookedAt = DateTime.UtcNow;
        WaitlistQueuedAt = null;
        ClearExceptionIfMatches("WAITLIST_FALLBACK");
        Touch();
    }

    public void MarkWaitlistFallback(string? practitionerId, string? message = null)
    {
        SchedulingStatus = WorkflowStepStatus.NeedsAttention;
        CurrentPractitionerId = string.IsNullOrWhiteSpace(practitionerId) ? CurrentPractitionerId : practitionerId.Trim();
        WaitlistQueuedAt = DateTime.UtcNow;
        MarkAttention("WAITLIST_FALLBACK", message ?? "No booking was completed. Scheduling moved to waitlist follow-up.");
    }

    public void FailScheduling(string message)
    {
        SchedulingStatus = WorkflowStepStatus.Failed;
        MarkAttention("SCHEDULING_FAILED", message);
    }

    public bool IsHumanReviewOverdue(DateTime nowUtc)
        => Status == WorkflowStatus.AwaitingHumanReview
           && HumanReviewDueAt is not null
           && HumanReviewDueAt.Value < nowUtc;

    private void Touch()
    {
        LastActivityAt = DateTime.UtcNow;
    }

    private void MarkAttention(string code, string message)
    {
        LatestExceptionCode = code;
        LatestExceptionMessage = message;
        RequiresAttention = true;
        Touch();
    }

    private void ClearException()
    {
        LatestExceptionCode = null;
        LatestExceptionMessage = null;
        RequiresAttention = Status is WorkflowStatus.AwaitingHumanReview or WorkflowStatus.Escalated or WorkflowStatus.Rejected
            || EncounterStatus == WorkflowStepStatus.Failed
            || RevenueStatus == WorkflowStepStatus.Failed
            || SchedulingStatus == WorkflowStepStatus.Failed
            || SchedulingStatus == WorkflowStepStatus.NeedsAttention
            || NotificationStatus == WorkflowStepStatus.Failed;
        Touch();
    }

    private void ClearExceptionIfMatches(string code)
    {
        if (LatestExceptionCode == code)
        {
            ClearException();
            return;
        }

        Touch();
    }
}
