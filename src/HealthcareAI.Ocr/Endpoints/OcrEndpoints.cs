using HealthcareAI.Domain.Ocr;
using HealthcareAI.Ocr.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HealthcareAI.Ocr.Endpoints;

public static class OcrEndpoints
{
    public static IEndpointRouteBuilder MapOcrEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/ocr").WithTags("OCR");

        group.MapPost("/jobs", async (
            CreateOcrJobRequest request,
            OcrDbContext db,
            CancellationToken ct) =>
        {
            var job = OcrJob.Create(Guid.NewGuid(), request.DocumentUrl, request.PatientId.ToString());
            db.OcrJobs.Add(job);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/v1/ocr/jobs/{job.Id}",
                new { job.Id, job.Status });
        });

        group.MapGet("/jobs/{id:guid}", async (
            Guid id,
            OcrDbContext db,
            CancellationToken ct) =>
        {
            var job = await db.OcrJobs.FindAsync([id], ct);
            return job is null ? Results.NotFound() : Results.Ok(job);
        });

        group.MapGet("/jobs", async (
            Guid? patientId,
            OcrDbContext db,
            CancellationToken ct) =>
        {
            var query = db.OcrJobs.AsQueryable();
            if (patientId.HasValue)
                query = query.Where(j => j.PatientId == patientId.Value.ToString());
            var jobs = await query.OrderByDescending(j => j.CreatedAt).Take(50)
                .Select(j => new { j.Id, j.PatientId, j.Status, j.CreatedAt })
                .ToListAsync(ct);
            return Results.Ok(jobs);
        });

        return app;
    }
}

public record CreateOcrJobRequest(Guid PatientId, string DocumentUrl, string DocumentType);
