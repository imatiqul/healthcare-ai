using HealthcareAI.Domain.Agents;
using HealthcareAI.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HealthcareAI.Agents.Infrastructure;

public class AgentDbContext : OutboxDbContext
{
    public DbSet<TriageWorkflow> TriageWorkflows => Set<TriageWorkflow>();
    public DbSet<AgentDecision> AgentDecisions => Set<AgentDecision>();

    public AgentDbContext(DbContextOptions<AgentDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<TriageWorkflow>(b =>
        {
            b.ToTable("triage_workflows");
            b.HasKey(e => e.Id);
            b.Property(e => e.Status).HasConversion<string>();
            b.Property(e => e.AssignedLevel).HasConversion<string>();
        });

        modelBuilder.Entity<AgentDecision>(b =>
        {
            b.ToTable("agent_decisions");
            b.HasKey(e => e.Id);
            b.HasIndex(e => e.WorkflowId);
        });
    }
}
