using HealthQCopilot.Domain.PopulationHealth;
using HealthQCopilot.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HealthQCopilot.PopulationHealth.Infrastructure;

public class PopHealthDbContext : OutboxDbContext
{
    public DbSet<PatientRisk> PatientRisks => Set<PatientRisk>();
    public DbSet<CareGap> CareGaps => Set<CareGap>();

    public PopHealthDbContext(DbContextOptions<PopHealthDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<PatientRisk>(b =>
        {
            b.ToTable("patient_risks");
            b.HasKey(e => e.Id);
            b.Property(e => e.Level).HasConversion<string>();
            b.HasIndex(e => e.PatientId);
        });

        modelBuilder.Entity<CareGap>(b =>
        {
            b.ToTable("care_gaps");
            b.HasKey(e => e.Id);
            b.Property(e => e.Status).HasConversion<string>();
            b.HasIndex(e => e.PatientId);
        });
    }
}
