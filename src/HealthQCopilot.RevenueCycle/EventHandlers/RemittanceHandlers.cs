using Dapr.Client;
using HealthQCopilot.Domain.Primitives;
using HealthQCopilot.Domain.RevenueCycle;
using MediatR;

namespace HealthQCopilot.RevenueCycle.EventHandlers;

/// <summary>
/// Handles RemittanceReceived domain event (EDI 835 received from payer).
///
/// Publishes to Dapr topic "remittance.received" so the AR (Accounts Receivable)
/// subsystem and the Finance dashboard are immediately notified of incoming payment.
/// </summary>
public sealed class RemittanceReceivedHandler(
    DaprClient dapr,
    ILogger<RemittanceReceivedHandler> logger)
    : INotificationHandler<DomainEventNotification<RemittanceReceived>>
{
    public async Task Handle(
        DomainEventNotification<RemittanceReceived> notification,
        CancellationToken ct)
    {
        var evt = notification.DomainEvent;

        await dapr.PublishEventAsync(
            pubsubName: "pubsub",
            topicName: "remittance.received",
            data: new
            {
                RemittanceId = evt.RemittanceId,
                PayerName    = evt.PayerName,
                TotalCents   = evt.TotalCents,
                OccurredAt   = evt.OccurredAt
            },
            cancellationToken: ct);

        logger.LogInformation(
            "Revenue: Remittance {RemittanceId} received from {Payer} — ${Amount:F2}",
            evt.RemittanceId, evt.PayerName, evt.TotalCents / 100m);
    }
}

/// <summary>
/// Handles RemittancePosted domain event.
///
/// The payment has been applied to AR ledger (individual claim lines settled).
/// Publishes to "remittance.posted" for HIPAA-compliant payment audit trail
/// and to trigger patient statement generation.
/// </summary>
public sealed class RemittancePostedHandler(
    DaprClient dapr,
    ILogger<RemittancePostedHandler> logger)
    : INotificationHandler<DomainEventNotification<RemittancePosted>>
{
    public async Task Handle(
        DomainEventNotification<RemittancePosted> notification,
        CancellationToken ct)
    {
        var evt = notification.DomainEvent;

        await dapr.PublishEventAsync(
            pubsubName: "pubsub",
            topicName: "remittance.posted",
            data: new
            {
                RemittanceId = evt.RemittanceId,
                TotalCents   = evt.TotalCents,
                OccurredAt   = evt.OccurredAt
            },
            cancellationToken: ct);

        logger.LogInformation(
            "Revenue: Remittance {RemittanceId} posted to AR — ${Amount:F2}",
            evt.RemittanceId, evt.TotalCents / 100m);
    }
}
