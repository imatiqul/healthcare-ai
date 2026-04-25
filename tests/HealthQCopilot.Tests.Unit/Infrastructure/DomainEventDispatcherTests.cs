using FluentAssertions;
using HealthQCopilot.Domain.Primitives;
using HealthQCopilot.Infrastructure.Messaging;
using MediatR;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace HealthQCopilot.Tests.Unit.Infrastructure;

// ── Test doubles ──────────────────────────────────────────────────────────────

public sealed record OrderPlaced(Guid OrderId) : DomainEvent;

public sealed class TestOrder : AggregateRoot<Guid>
{
    public TestOrder(Guid id)
    {
        Id = id;
        RaiseDomainEvent(new OrderPlaced(id));
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

public class DomainEventDispatcherTests
{
    private readonly IPublisher _publisher = Substitute.For<IPublisher>();
    private readonly ILogger<DomainEventDispatcher> _logger =
        Substitute.For<ILogger<DomainEventDispatcher>>();

    [Fact]
    public async Task DispatchAsync_WithAggregateThatHasDomainEvents_ShouldPublishWrappedNotification()
    {
        // Arrange
        var dispatcher = new DomainEventDispatcher(_publisher, _logger);
        var order = new TestOrder(Guid.NewGuid());
        order.DomainEvents.Should().HaveCount(1);

        // Act
        await dispatcher.DispatchAsync([order]);

        // Assert — MediatR Publish called once with the wrapper notification
        await _publisher.Received(1).Publish(
            Arg.Is<DomainEventNotification<OrderPlaced>>(n => n.DomainEvent.OrderId == order.Id),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DispatchAsync_ClearsDomainEventsAfterDispatch()
    {
        // Arrange
        var dispatcher = new DomainEventDispatcher(_publisher, _logger);
        var order = new TestOrder(Guid.NewGuid());

        // Act
        await dispatcher.DispatchAsync([order]);

        // Assert — events cleared so double-dispatch is safe
        order.DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public async Task DispatchAsync_WithNoAggregates_ShouldNotPublish()
    {
        // Arrange
        var dispatcher = new DomainEventDispatcher(_publisher, _logger);

        // Act
        await dispatcher.DispatchAsync([]);

        // Assert
        await _publisher.DidNotReceive().Publish(Arg.Any<INotification>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DispatchAsync_WithMultipleAggregates_ShouldPublishAllEvents()
    {
        // Arrange
        var dispatcher = new DomainEventDispatcher(_publisher, _logger);
        var order1 = new TestOrder(Guid.NewGuid());
        var order2 = new TestOrder(Guid.NewGuid());

        // Act
        await dispatcher.DispatchAsync([order1, order2]);

        // Assert — two events, one per aggregate
        await _publisher.Received(2).Publish(
            Arg.Any<DomainEventNotification<OrderPlaced>>(),
            Arg.Any<CancellationToken>());
    }
}
