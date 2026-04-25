namespace HealthQCopilot.Domain.Primitives;

/// <summary>
/// Unit of Work pattern: wraps a single database transaction that may span
/// multiple repositories. Commit publishes pending domain events via the
/// outbox and flushes the EF Core change tracker.
/// </summary>
public interface IUnitOfWork
{
    /// <summary>Persists all pending changes and relays outbox domain events.</summary>
    Task<int> CommitAsync(CancellationToken ct = default);
}
