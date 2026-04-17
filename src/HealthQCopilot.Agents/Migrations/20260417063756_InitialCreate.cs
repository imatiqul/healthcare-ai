using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealthQCopilot.Agents.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "agent_decisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkflowId = table.Column<Guid>(type: "uuid", nullable: false),
                    AgentName = table.Column<string>(type: "text", nullable: false),
                    Input = table.Column<string>(type: "text", nullable: false),
                    Output = table.Column<string>(type: "text", nullable: false),
                    IsGuardApproved = table.Column<bool>(type: "boolean", nullable: false),
                    Latency = table.Column<TimeSpan>(type: "interval", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agent_decisions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "demo_insights",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SessionsAnalyzed = table.Column<int>(type: "integer", nullable: false),
                    AverageNps = table.Column<double>(type: "double precision", nullable: false),
                    TopStrengths = table.Column<string>(type: "text", nullable: false),
                    TopWeaknesses = table.Column<string>(type: "text", nullable: false),
                    Recommendations = table.Column<string>(type: "text", nullable: false),
                    RawAnalysis = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_demo_insights", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "demo_sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientName = table.Column<string>(type: "text", nullable: false),
                    Company = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CurrentStep = table.Column<string>(type: "text", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    GuideSessionId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_demo_sessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "guide_conversations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastMessageAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_guide_conversations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "outbox_events",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    payload = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    processed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_outbox_events", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "triage_workflows",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<string>(type: "text", nullable: false),
                    TranscriptText = table.Column<string>(type: "text", nullable: false),
                    AssignedLevel = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    AgentReasoning = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_triage_workflows", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "demo_overall_feedbacks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DemoSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    NpsScore = table.Column<int>(type: "integer", nullable: false),
                    FeaturePriorities = table.Column<List<string>>(type: "jsonb", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_demo_overall_feedbacks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_demo_overall_feedbacks_demo_sessions_DemoSessionId",
                        column: x => x.DemoSessionId,
                        principalTable: "demo_sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "demo_step_feedbacks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DemoSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Step = table.Column<string>(type: "text", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Tags = table.Column<List<string>>(type: "jsonb", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_demo_step_feedbacks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_demo_step_feedbacks_demo_sessions_DemoSessionId",
                        column: x => x.DemoSessionId,
                        principalTable: "demo_sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "guide_messages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_guide_messages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_guide_messages_guide_conversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "guide_conversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_agent_decisions_WorkflowId",
                table: "agent_decisions",
                column: "WorkflowId");

            migrationBuilder.CreateIndex(
                name: "IX_demo_insights_GeneratedAt",
                table: "demo_insights",
                column: "GeneratedAt");

            migrationBuilder.CreateIndex(
                name: "IX_demo_overall_feedbacks_DemoSessionId",
                table: "demo_overall_feedbacks",
                column: "DemoSessionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_demo_sessions_Status",
                table: "demo_sessions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_demo_step_feedbacks_DemoSessionId",
                table: "demo_step_feedbacks",
                column: "DemoSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_guide_messages_ConversationId",
                table: "guide_messages",
                column: "ConversationId");

            migrationBuilder.CreateIndex(
                name: "IX_outbox_events_processed_at",
                table: "outbox_events",
                column: "processed_at",
                filter: "processed_at IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "agent_decisions");

            migrationBuilder.DropTable(
                name: "demo_insights");

            migrationBuilder.DropTable(
                name: "demo_overall_feedbacks");

            migrationBuilder.DropTable(
                name: "demo_step_feedbacks");

            migrationBuilder.DropTable(
                name: "guide_messages");

            migrationBuilder.DropTable(
                name: "outbox_events");

            migrationBuilder.DropTable(
                name: "triage_workflows");

            migrationBuilder.DropTable(
                name: "demo_sessions");

            migrationBuilder.DropTable(
                name: "guide_conversations");
        }
    }
}
