using HealthQCopilot.Domain.Primitives;

namespace HealthQCopilot.Domain.RevenueCycle;

public enum PriorAuthStatus { Draft, Submitted, UnderReview, Approved, Denied }

public class PriorAuth : AggregateRoot<Guid>
{
    public string PatientId { get; private set; } = string.Empty;
    public string PatientName { get; private set; } = string.Empty;
    public string Procedure { get; private set; } = string.Empty;
    public string? ProcedureCode { get; private set; }
    public PriorAuthStatus Status { get; private set; } = PriorAuthStatus.Draft;
    public string? InsurancePayer { get; private set; }
    public string? DenialReason { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? SubmittedAt { get; private set; }
    public DateTime? ResolvedAt { get; private set; }

    private PriorAuth() { }

    public static PriorAuth Create(string patientId, string patientName, string procedure, string? procedureCode, string? insurancePayer)
    {
        var auth = new PriorAuth
        {
            Id = Guid.NewGuid(),
            PatientId = patientId,
            PatientName = patientName,
            Procedure = procedure,
            ProcedureCode = procedureCode,
            InsurancePayer = insurancePayer,
            Status = PriorAuthStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };
        return auth;
    }

    public Result Submit()
    {
        if (Status != PriorAuthStatus.Draft)
            return Result.Failure("Only draft authorizations can be submitted");

        Status = PriorAuthStatus.Submitted;
        SubmittedAt = DateTime.UtcNow;
        RaiseDomainEvent(new PriorAuthSubmitted(Id, PatientId, Procedure));
        return Result.Success();
    }

    public Result Approve()
    {
        if (Status != PriorAuthStatus.Submitted && Status != PriorAuthStatus.UnderReview)
            return Result.Failure("Authorization is not in a reviewable state");

        Status = PriorAuthStatus.Approved;
        ResolvedAt = DateTime.UtcNow;
        RaiseDomainEvent(new PriorAuthApproved(Id, PatientId));
        return Result.Success();
    }

    public Result Deny(string reason)
    {
        if (Status != PriorAuthStatus.Submitted && Status != PriorAuthStatus.UnderReview)
            return Result.Failure("Authorization is not in a reviewable state");

        Status = PriorAuthStatus.Denied;
        DenialReason = reason;
        ResolvedAt = DateTime.UtcNow;
        RaiseDomainEvent(new PriorAuthDenied(Id, PatientId, reason));
        return Result.Success();
    }

    public void MarkUnderReview()
    {
        if (Status == PriorAuthStatus.Submitted)
            Status = PriorAuthStatus.UnderReview;
    }
}

public sealed record PriorAuthSubmitted(Guid AuthId, string PatientId, string Procedure) : DomainEvent;
public sealed record PriorAuthApproved(Guid AuthId, string PatientId) : DomainEvent;
public sealed record PriorAuthDenied(Guid AuthId, string PatientId, string Reason) : DomainEvent;
