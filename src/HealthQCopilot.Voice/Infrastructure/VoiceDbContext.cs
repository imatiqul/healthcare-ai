using HealthQCopilot.Domain.Voice;
using HealthQCopilot.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HealthQCopilot.Voice.Infrastructure;

public class VoiceDbContext : OutboxDbContext
{
    public DbSet<VoiceSession> VoiceSessions => Set<VoiceSession>();

    public VoiceDbContext(DbContextOptions<VoiceDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<VoiceSession>(b =>
        {
            b.ToTable("voice_sessions");
            b.HasKey(e => e.Id);
            b.Property(e => e.PatientId).HasMaxLength(128).IsRequired();
            b.Property(e => e.Status).HasConversion<string>();
        });
    }
}
