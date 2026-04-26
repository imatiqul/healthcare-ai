using Dapr.Client;
using HealthQCopilot.Domain.Primitives;
using HealthQCopilot.Domain.RevenueCycle;
using MediatR;

namespace HealthQCopilot.RevenueCycle.EventHandlers;

/// <summary>
/// Handles ClaimSubmitted domain event.
///
/// Publishes to Dapr topic "claim.submitted" so the clearinghouse adapter
/// (EDI 837 transmitter) can pick up and transmit the claim.
/// </summary>
public sealed class ClaimSubmittedHandler(
    DaprClient dapr,
    ILogger<ClaimSubmittedHandler> logger)
    : INotificationHandler<DomainEventNotification<ClaimSubmitted>>
{
    public async Task Handle(
        DomainEventNotification<ClaimSubmitted> notification,
        CancellationToken ct)
    {
        var evt = notification.DomainEvent;

        await dapr.PublishEventAsync(
            pubsubName: "pubsub",
            topicName: "claim.submitted",
            data: new
            {
                ClaimId = evt.ClaimId,
                PatientId = evt.PatientId,
                Payer = evt.Payer,
                OccurredAt = evt.OccurredAt
            },
            cancellationToken: ct);

        logger.LogInformation(
            "Revenue: Claim {ClaimId} submitted to payer {Payer} for patient {PatientId}",
            evt.ClaimId, evt.Payer, evt.PatientId);
    }
}

/// <summary>
/// Handles ClaimRejected domain event.
///
/// Clearinghouse rejected the claim (999 AK5*R). Publishes to "claim.rejected"
/// so the Revenue Coding team can be alerted to correct and resubmit.
/// </summary>
public sealed class ClaimRejectedHandler(
    DaprClient dapr,
    ILogger<ClaimRejectedHandler> logger)
    : INotificationHandler<DomainEventNotification<ClaimRejected>>
{
    public async Task Handle(
        DomainEventNotification<ClaimRejected> notification,
        CancellationToken ct)
    {
        var evt = notification.DomainEvent;

        await dapr.PublishEventAsync(
            pubsubName: "pubsub",
            topicName: "claim.rejected",
            data: new
            {
                ClaimId = evt.ClaimId,
                Reason = evt.Reason,
                OccurredAt = evt.OccurredAt
            },
            cancellationToken: ct);

        logger.LogWarning(
            "Revenue: Claim {ClaimId} REJECTED — {Reason}", evt.ClaimId, evt.Reason);
    }
}
