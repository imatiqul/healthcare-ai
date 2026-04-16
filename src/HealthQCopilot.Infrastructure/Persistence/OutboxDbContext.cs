using System.Text.Json;
using HealthQCopilot.Domain.Primitives;
using Microsoft.EntityFrameworkCore;

namespace HealthQCopilot.Infrastructure.Persistence;

public class OutboxEvent
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

public abstract class OutboxDbContext : DbContext
{
    public DbSet<OutboxEvent> OutboxEvents => Set<OutboxEvent>();

    protected OutboxDbContext(DbContextOptions options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<OutboxEvent>(b =>
        {
            b.ToTable("outbox_events");
            b.HasKey(e => e.Id);
            b.Property(e => e.Id).HasColumnName("id");
            b.Property(e => e.Type).HasColumnName("type").HasMaxLength(256).IsRequired();
            b.Property(e => e.Payload).HasColumnName("payload").IsRequired();
            b.Property(e => e.CreatedAt).HasColumnName("created_at");
            b.Property(e => e.ProcessedAt).HasColumnName("processed_at");
            b.HasIndex(e => e.ProcessedAt).HasFilter("processed_at IS NULL");
        });
    }

    public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        var domainEvents = ChangeTracker.Entries<AggregateRoot<Guid>>()
            .Where(e => e.Entity.DomainEvents.Count != 0)
            .SelectMany(e => e.Entity.DomainEvents)
            .ToList();

        foreach (var evt in domainEvents)
        {
            OutboxEvents.Add(new OutboxEvent
            {
                Id = Guid.NewGuid(),
                Type = evt.GetType().Name,
                Payload = JsonSerializer.Serialize(evt, evt.GetType()),
                CreatedAt = DateTime.UtcNow,
                ProcessedAt = null
            });
        }

        // Clear domain events after persisting to outbox
        var aggregates = ChangeTracker.Entries<AggregateRoot<Guid>>().ToList();
        var result = await base.SaveChangesAsync(ct);
        foreach (var entry in aggregates)
            entry.Entity.ClearDomainEvents();

        return result;
    }
}
