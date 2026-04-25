using MediatR;

namespace HealthQCopilot.Domain.Primitives;

/// <summary>
/// MediatR notification wrapper so domain events can be dispatched
/// through the MediatR pipeline (logging, validation, etc.).
/// </summary>
public sealed class DomainEventNotification<T>(T domainEvent) : INotification
    where T : IDomainEvent
{
    public T DomainEvent { get; } = domainEvent;
}
