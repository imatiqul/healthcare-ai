using Dapr.Client;
using HealthQCopilot.Domain.Primitives;
using HealthQCopilot.Domain.RevenueCycle;
using MediatR;

namespace HealthQCopilot.RevenueCycle.EventHandlers;

/// <summary>
/// Handles PriorAuthApproved and PriorAuthDenied domain events.
///
/// Both events are HIPAA-significant: approval enables procedures/prescriptions;
/// denial triggers patient notification and appeals workflow.
///
/// Responsibilities:
///   1. Publish to Dapr pub/sub topic "priorauth.result" with an Approved/Denied discriminator
///      so the Notification Service can alert the patient and referring provider.
///   2. Log for the revenue audit trail.
/// </summary>
public sealed class PriorAuthApprovedHandler(
    DaprClient dapr,
    ILogger<PriorAuthApprovedHandler> logger)
    : INotificationHandler<DomainEventNotification<PriorAuthApproved>>
{
    public async Task Handle(
        DomainEventNotification<PriorAuthApproved> notification,
        CancellationToken ct)
    {
        var evt = notification.DomainEvent;

        await dapr.PublishEventAsync(
            pubsubName: "pubsub",
            topicName: "priorauth.result",
            data: new
            {
                AuthId     = evt.AuthId,
                PatientId  = evt.PatientId,
                Outcome    = "Approved",
                Reason     = (string?)null,
                OccurredAt = evt.OccurredAt
            },
            cancellationToken: ct);

        logger.LogInformation(
            "Revenue: PriorAuth {AuthId} approved for patient {PatientId}",
            evt.AuthId, evt.PatientId);
    }
}

public sealed class PriorAuthDeniedHandler(
    DaprClient dapr,
    ILogger<PriorAuthDeniedHandler> logger)
    : INotificationHandler<DomainEventNotification<PriorAuthDenied>>
{
    public async Task Handle(
        DomainEventNotification<PriorAuthDenied> notification,
        CancellationToken ct)
    {
        var evt = notification.DomainEvent;

        await dapr.PublishEventAsync(
            pubsubName: "pubsub",
            topicName: "priorauth.result",
            data: new
            {
                AuthId     = evt.AuthId,
                PatientId  = evt.PatientId,
                Outcome    = "Denied",
                Reason     = evt.Reason,
                OccurredAt = evt.OccurredAt
            },
            cancellationToken: ct);

        logger.LogWarning(
            "Revenue: PriorAuth {AuthId} DENIED for patient {PatientId} — Reason: {Reason}",
            evt.AuthId, evt.PatientId, evt.Reason);
    }
}
