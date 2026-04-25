namespace HealthQCopilot.Domain.Primitives;

/// <summary>
/// Generic repository interface for aggregate roots.
/// Implementations live in HealthQCopilot.Infrastructure.Persistence and
/// use the bounded-context DbContext.
/// </summary>
public interface IRepository<TAggregate, TId>
    where TAggregate : AggregateRoot<TId>
    where TId : notnull
{
    Task<TAggregate?> GetByIdAsync(TId id, CancellationToken ct = default);
    Task<IReadOnlyList<TAggregate>> GetAllAsync(CancellationToken ct = default);
    Task AddAsync(TAggregate aggregate, CancellationToken ct = default);
    void Update(TAggregate aggregate);
    void Remove(TAggregate aggregate);
}
