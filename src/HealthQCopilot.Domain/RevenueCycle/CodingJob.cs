using HealthQCopilot.Domain.Primitives;

namespace HealthQCopilot.Domain.RevenueCycle;

public enum CodingJobStatus { Pending, InReview, Approved, Submitted }

public class CodingJob : AggregateRoot<Guid>
{
    public string EncounterId { get; private set; } = string.Empty;
    public string PatientId { get; private set; } = string.Empty;
    public string PatientName { get; private set; } = string.Empty;
    public CodingJobStatus Status { get; private set; } = CodingJobStatus.Pending;
    public List<string> SuggestedCodes { get; private set; } = [];
    public List<string> ApprovedCodes { get; private set; } = [];
    public string? ReviewedBy { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? ReviewedAt { get; private set; }

    private CodingJob() { }

    public static CodingJob Create(string encounterId, string patientId, string patientName, List<string> suggestedCodes)
    {
        var job = new CodingJob
        {
            Id = Guid.NewGuid(),
            EncounterId = encounterId,
            PatientId = patientId,
            PatientName = patientName,
            SuggestedCodes = suggestedCodes,
            Status = CodingJobStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        job.RaiseDomainEvent(new CodingJobCreated(job.Id, encounterId));
        return job;
    }

    public Result Review(List<string> approvedCodes, string reviewedBy)
    {
        if (Status != CodingJobStatus.Pending && Status != CodingJobStatus.InReview)
            return Result.Failure("Job is not in a reviewable state");

        ApprovedCodes = approvedCodes;
        ReviewedBy = reviewedBy;
        Status = CodingJobStatus.Approved;
        ReviewedAt = DateTime.UtcNow;
        RaiseDomainEvent(new CodingJobReviewed(Id, approvedCodes));
        return Result.Success();
    }

    public Result Submit()
    {
        if (Status != CodingJobStatus.Approved)
            return Result.Failure("Job must be approved before submission");

        Status = CodingJobStatus.Submitted;
        RaiseDomainEvent(new CodingJobSubmitted(Id, ApprovedCodes));
        return Result.Success();
    }

    public void MarkInReview()
    {
        if (Status == CodingJobStatus.Pending)
            Status = CodingJobStatus.InReview;
    }
}

public sealed record CodingJobCreated(Guid JobId, string EncounterId) : DomainEvent;
public sealed record CodingJobReviewed(Guid JobId, List<string> ApprovedCodes) : DomainEvent;
public sealed record CodingJobSubmitted(Guid JobId, List<string> Codes) : DomainEvent;
