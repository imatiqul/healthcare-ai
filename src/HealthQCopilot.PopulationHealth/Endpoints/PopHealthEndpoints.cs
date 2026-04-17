using HealthQCopilot.Domain.PopulationHealth;
using HealthQCopilot.PopulationHealth.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HealthQCopilot.PopulationHealth.Endpoints;

public static class PopHealthEndpoints
{
    public static IEndpointRouteBuilder MapPopHealthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/population-health").WithTags("Population Health");

        group.MapGet("/risks", async (
            string? riskLevel,
            int? top,
            PopHealthDbContext db,
            CancellationToken ct) =>
        {
            var query = db.PatientRisks.AsQueryable();
            if (!string.IsNullOrEmpty(riskLevel) && Enum.TryParse<RiskLevel>(riskLevel, true, out var level))
                query = query.Where(r => r.Level == level);
            var risks = await query
                .OrderByDescending(r => r.RiskScore)
                .Take(top ?? 50)
                .Select(r => new { r.Id, r.PatientId, r.Level, r.RiskScore, r.AssessedAt })
                .ToListAsync(ct);
            return Results.Ok(risks);
        });

        group.MapGet("/risks/{patientId:guid}", async (
            Guid patientId,
            PopHealthDbContext db,
            CancellationToken ct) =>
        {
            var risk = await db.PatientRisks
                .Where(r => r.PatientId == patientId.ToString())
                .OrderByDescending(r => r.AssessedAt)
                .FirstOrDefaultAsync(ct);
            return risk is null ? Results.NotFound() : Results.Ok(risk);
        });

        group.MapGet("/care-gaps", async (
            string? status,
            PopHealthDbContext db,
            CancellationToken ct) =>
        {
            var query = db.CareGaps.AsQueryable();
            if (!string.IsNullOrEmpty(status) && Enum.TryParse<CareGapStatus>(status, true, out var s))
                query = query.Where(g => g.Status == s);
            var gaps = await query
                .OrderByDescending(g => g.IdentifiedAt)
                .Take(100)
                .Select(g => new { g.Id, g.PatientId, g.MeasureId, g.Status, g.IdentifiedAt })
                .ToListAsync(ct);
            return Results.Ok(gaps);
        });

        group.MapPost("/care-gaps/{id:guid}/address", async (
            Guid id,
            PopHealthDbContext db,
            CancellationToken ct) =>
        {
            var gap = await db.CareGaps.FindAsync([id], ct);
            if (gap is null) return Results.NotFound();
            gap.Address();
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { gap.Id, gap.Status });
        });

        group.MapGet("/stats", async (
            PopHealthDbContext db,
            CancellationToken ct) =>
        {
            var highRisk = await db.PatientRisks.CountAsync(r => r.Level == RiskLevel.Critical || r.Level == RiskLevel.High, ct);
            var totalPatients = await db.PatientRisks.CountAsync(ct);
            var openGaps = await db.CareGaps.CountAsync(g => g.Status == CareGapStatus.Open, ct);
            var closedGaps = await db.CareGaps.CountAsync(g => g.Status == CareGapStatus.Addressed, ct);
            return Results.Ok(new { HighRiskPatients = highRisk, TotalPatients = totalPatients, OpenCareGaps = openGaps, ClosedCareGaps = closedGaps });
        });

        return app;
    }
}
