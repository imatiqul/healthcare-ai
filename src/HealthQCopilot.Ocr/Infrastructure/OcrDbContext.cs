using HealthQCopilot.Domain.Ocr;
using HealthQCopilot.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HealthQCopilot.Ocr.Infrastructure;

public class OcrDbContext : OutboxDbContext
{
    public DbSet<OcrJob> OcrJobs => Set<OcrJob>();

    public OcrDbContext(DbContextOptions<OcrDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<OcrJob>(b =>
        {
            b.ToTable("ocr_jobs");
            b.HasKey(e => e.Id);
            b.Property(e => e.Status).HasConversion<string>();
            b.Property(e => e.DocumentUrl).HasMaxLength(2048).IsRequired();
        });
    }
}
