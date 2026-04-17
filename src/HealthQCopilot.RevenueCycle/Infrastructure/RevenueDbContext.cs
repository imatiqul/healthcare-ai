using HealthQCopilot.Domain.RevenueCycle;
using HealthQCopilot.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HealthQCopilot.RevenueCycle.Infrastructure;

public class RevenueDbContext : OutboxDbContext
{
    public DbSet<CodingJob> CodingJobs => Set<CodingJob>();
    public DbSet<PriorAuth> PriorAuths => Set<PriorAuth>();

    public RevenueDbContext(DbContextOptions<RevenueDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<CodingJob>(b =>
        {
            b.ToTable("coding_jobs");
            b.HasKey(e => e.Id);
            b.Property(e => e.Status).HasConversion<string>();
            b.Property(e => e.EncounterId).HasMaxLength(128).IsRequired();
            b.Property(e => e.PatientId).HasMaxLength(128).IsRequired();
            b.Property(e => e.PatientName).HasMaxLength(256).IsRequired();
            b.Property(e => e.ReviewedBy).HasMaxLength(128);
            b.Property(e => e.SuggestedCodes).HasConversion(
                v => string.Join(',', v),
                v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList());
            b.Property(e => e.ApprovedCodes).HasConversion(
                v => string.Join(',', v),
                v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList());
            b.HasIndex(e => e.PatientId);
            b.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<PriorAuth>(b =>
        {
            b.ToTable("prior_auths");
            b.HasKey(e => e.Id);
            b.Property(e => e.Status).HasConversion<string>();
            b.Property(e => e.PatientId).HasMaxLength(128).IsRequired();
            b.Property(e => e.PatientName).HasMaxLength(256).IsRequired();
            b.Property(e => e.Procedure).HasMaxLength(512).IsRequired();
            b.Property(e => e.ProcedureCode).HasMaxLength(32);
            b.Property(e => e.InsurancePayer).HasMaxLength(256);
            b.Property(e => e.DenialReason).HasMaxLength(1024);
            b.HasIndex(e => e.PatientId);
            b.HasIndex(e => e.Status);
        });
    }
}
