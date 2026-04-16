using HealthQCopilot.Domain.Identity;
using HealthQCopilot.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HealthQCopilot.Identity.Persistence;

public class IdentityDbContext(DbContextOptions<IdentityDbContext> options) 
    : OutboxDbContext(options)
{
    public DbSet<UserAccount> UserAccounts => Set<UserAccount>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<UserAccount>(entity =>
        {
            entity.ToTable("user_accounts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ExternalId).HasMaxLength(256).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(256).IsRequired();
            entity.Property(e => e.DisplayName).HasMaxLength(256).IsRequired();
            entity.Property(e => e.Role).HasConversion<string>().HasMaxLength(50);
            entity.HasIndex(e => e.ExternalId).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
        });
    }
}
