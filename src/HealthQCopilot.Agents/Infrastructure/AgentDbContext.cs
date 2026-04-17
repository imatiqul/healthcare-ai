using HealthQCopilot.Domain.Agents;
using HealthQCopilot.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HealthQCopilot.Agents.Infrastructure;

public class AgentDbContext : OutboxDbContext
{
    public DbSet<TriageWorkflow> TriageWorkflows => Set<TriageWorkflow>();
    public DbSet<AgentDecision> AgentDecisions => Set<AgentDecision>();
    public DbSet<GuideConversation> GuideConversations => Set<GuideConversation>();
    public DbSet<GuideMessage> GuideMessages => Set<GuideMessage>();
    public DbSet<DemoSession> DemoSessions => Set<DemoSession>();
    public DbSet<StepFeedback> StepFeedbacks => Set<StepFeedback>();
    public DbSet<OverallFeedback> OverallFeedbacks => Set<OverallFeedback>();
    public DbSet<DemoInsight> DemoInsights => Set<DemoInsight>();

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

        modelBuilder.Entity<GuideConversation>(b =>
        {
            b.ToTable("guide_conversations");
            b.HasKey(e => e.Id);
            b.HasMany(e => e.Messages)
                .WithOne()
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<GuideMessage>(b =>
        {
            b.ToTable("guide_messages");
            b.HasKey(e => e.Id);
            b.HasIndex(e => e.ConversationId);
        });

        modelBuilder.Entity<DemoSession>(b =>
        {
            b.ToTable("demo_sessions");
            b.HasKey(e => e.Id);
            b.Property(e => e.Status).HasConversion<string>();
            b.Property(e => e.CurrentStep).HasConversion<string>();
            b.HasIndex(e => e.Status);
            b.HasMany(e => e.StepFeedbacks)
                .WithOne()
                .HasForeignKey(f => f.DemoSessionId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(e => e.OverallFeedback)
                .WithOne()
                .HasForeignKey<OverallFeedback>(f => f.DemoSessionId)
                .OnDelete(DeleteBehavior.Cascade);
            b.Navigation(e => e.StepFeedbacks).UsePropertyAccessMode(PropertyAccessMode.Field);
        });

        modelBuilder.Entity<StepFeedback>(b =>
        {
            b.ToTable("demo_step_feedbacks");
            b.HasKey(e => e.Id);
            b.Property(e => e.Step).HasConversion<string>();
            b.Property(e => e.Tags).HasColumnType("jsonb");
            b.HasIndex(e => e.DemoSessionId);
        });

        modelBuilder.Entity<OverallFeedback>(b =>
        {
            b.ToTable("demo_overall_feedbacks");
            b.HasKey(e => e.Id);
            b.Property(e => e.FeaturePriorities).HasColumnType("jsonb");
            b.HasIndex(e => e.DemoSessionId).IsUnique();
        });

        modelBuilder.Entity<DemoInsight>(b =>
        {
            b.ToTable("demo_insights");
            b.HasKey(e => e.Id);
            b.HasIndex(e => e.GeneratedAt);
        });
    }
}
