using HealthQCopilot.Domain.Primitives;
using HealthQCopilot.Infrastructure.Messaging;
using Microsoft.EntityFrameworkCore;

namespace HealthQCopilot.Infrastructure.Persistence;

/// <summary>
/// EF Core implementation of IUnitOfWork.
/// After SaveChangesAsync succeeds, dispatches domain events from all
/// tracked aggregate roots through MediatR via DomainEventDispatcher.
/// </summary>
public sealed class EfUnitOfWork<TContext>(TContext context, DomainEventDispatcher dispatcher)
    : IUnitOfWork
    where TContext : DbContext
{
    public async Task<int> CommitAsync(CancellationToken ct = default)
    {
        // Collect aggregates before save — after save EF resets change state
        var aggregates = context.ChangeTracker
            .Entries<AggregateRoot<Guid>>()
            .Where(e => e.Entity.DomainEvents.Count > 0)
            .Select(e => e.Entity)
            .ToList();

        var rows = await context.SaveChangesAsync(ct);

        // Dispatch domain events only after the transaction is committed
        if (aggregates.Count > 0)
            await dispatcher.DispatchAsync(aggregates, ct);

        return rows;
    }
}
