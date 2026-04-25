using HealthQCopilot.Domain.Primitives;
using Microsoft.EntityFrameworkCore;

namespace HealthQCopilot.Infrastructure.Persistence;

/// <summary>
/// Generic EF Core repository implementation for aggregate roots.
/// Bounded-context repositories inherit from this and expose only the
/// queries relevant to their domain.
/// </summary>
public abstract class EfRepository<TAggregate, TId, TContext>(TContext context)
    : IRepository<TAggregate, TId>
    where TAggregate : AggregateRoot<TId>
    where TId : notnull
    where TContext : DbContext
{
    protected readonly TContext Context = context;

    protected virtual IQueryable<TAggregate> Query() => Context.Set<TAggregate>();

    public virtual async Task<TAggregate?> GetByIdAsync(TId id, CancellationToken ct = default) =>
        await Query().FirstOrDefaultAsync(e => e.Id.Equals(id), ct);

    public virtual async Task<IReadOnlyList<TAggregate>> GetAllAsync(CancellationToken ct = default) =>
        await Query().ToListAsync(ct);

    public virtual async Task AddAsync(TAggregate aggregate, CancellationToken ct = default) =>
        await Context.Set<TAggregate>().AddAsync(aggregate, ct);

    public virtual void Update(TAggregate aggregate) =>
        Context.Set<TAggregate>().Update(aggregate);

    public virtual void Remove(TAggregate aggregate) =>
        Context.Set<TAggregate>().Remove(aggregate);
}
