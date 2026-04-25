using HealthQCopilot.Domain.Primitives;
using MediatR;
using Microsoft.Extensions.Logging;

namespace HealthQCopilot.Infrastructure.Messaging;

/// <summary>
/// Dispatches domain events from aggregate roots through MediatR so that
/// application-layer handlers (INotificationHandler&lt;DomainEventNotification&lt;T&gt;&gt;)
/// can react without coupling the domain to infrastructure.
///
/// Call after SaveChangesAsync so handlers observe committed state.
/// </summary>
public sealed class DomainEventDispatcher(IPublisher publisher, ILogger<DomainEventDispatcher> logger)
{
    public async Task DispatchAsync(IEnumerable<AggregateRoot<Guid>> aggregates, CancellationToken ct = default)
    {
        var events = aggregates
            .SelectMany(a =>
            {
                var evts = a.DomainEvents.ToList();
                a.ClearDomainEvents();
                return evts;
            })
            .ToList();

        foreach (var evt in events)
        {
            logger.LogDebug("Dispatching domain event {EventType}", evt.GetType().Name);

            var notificationType = typeof(DomainEventNotification<>).MakeGenericType(evt.GetType());
            var notification = (INotification)Activator.CreateInstance(notificationType, evt)!;
            await publisher.Publish(notification, ct);
        }
    }
}
