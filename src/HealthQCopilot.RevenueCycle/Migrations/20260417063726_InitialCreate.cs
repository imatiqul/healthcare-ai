using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealthQCopilot.RevenueCycle.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "coding_jobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EncounterId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    PatientId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    PatientName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    SuggestedCodes = table.Column<string>(type: "text", nullable: false),
                    ApprovedCodes = table.Column<string>(type: "text", nullable: false),
                    ReviewedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_coding_jobs", x => x.Id);
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
                name: "prior_auths",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    PatientName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Procedure = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    ProcedureCode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    InsurancePayer = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    DenialReason = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_prior_auths", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_coding_jobs_PatientId",
                table: "coding_jobs",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_coding_jobs_Status",
                table: "coding_jobs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_outbox_events_processed_at",
                table: "outbox_events",
                column: "processed_at",
                filter: "processed_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_prior_auths_PatientId",
                table: "prior_auths",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_prior_auths_Status",
                table: "prior_auths",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "coding_jobs");

            migrationBuilder.DropTable(
                name: "outbox_events");

            migrationBuilder.DropTable(
                name: "prior_auths");
        }
    }
}
