using Dapr.Client;
using HealthQCopilot.Domain.Primitives;
using HealthQCopilot.Domain.RevenueCycle;
using MediatR;

namespace HealthQCopilot.RevenueCycle.EventHandlers;

/// <summary>
/// Handles the CodingJobSubmitted domain event.
///
/// Responsibilities:
///   1. Publish to Dapr pub/sub topic "coding-job.submitted" so the ClaimSubmission
///      workflow can be triggered by the Notification or Orchestration service.
///   2. Log for revenue audit trail.
///
/// CodingJobCreated and CodingJobReviewed are internal workflow transitions —
/// only CodingJobSubmitted crosses a bounded-context boundary and requires
/// an integration event.
/// </summary>
public sealed class CodingJobSubmittedHandler(
    DaprClient dapr,
    ILogger<CodingJobSubmittedHandler> logger)
    : INotificationHandler<DomainEventNotification<CodingJobSubmitted>>
{
    public async Task Handle(
        DomainEventNotification<CodingJobSubmitted> notification,
        CancellationToken ct)
    {
        var evt = notification.DomainEvent;

        await dapr.PublishEventAsync(
            pubsubName: "pubsub",
            topicName: "coding-job.submitted",
            data: new
            {
                JobId      = evt.JobId,
                Codes      = evt.Codes,
                OccurredAt = evt.OccurredAt
            },
            cancellationToken: ct);

        logger.LogInformation(
            "Revenue: CodingJob {JobId} submitted with {CodeCount} approved codes",
            evt.JobId, evt.Codes.Count);
    }
}
