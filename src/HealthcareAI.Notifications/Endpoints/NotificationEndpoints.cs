using HealthcareAI.Domain.Notifications;
using HealthcareAI.Notifications.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HealthcareAI.Notifications.Endpoints;

public static class NotificationEndpoints
{
    public static IEndpointRouteBuilder MapNotificationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/notifications").WithTags("Notifications");

        group.MapPost("/campaigns", async (
            CreateCampaignRequest request,
            NotificationDbContext db,
            CancellationToken ct) =>
        {
            var campaign = OutreachCampaign.Create(Guid.NewGuid(), request.Name, request.Type, string.Join(",", request.TargetPatientIds));
            db.OutreachCampaigns.Add(campaign);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/v1/notifications/campaigns/{campaign.Id}",
                new { campaign.Id, campaign.Status });
        });

        group.MapPost("/campaigns/{id:guid}/activate", async (
            Guid id,
            NotificationDbContext db,
            CancellationToken ct) =>
        {
            var campaign = await db.OutreachCampaigns.FindAsync([id], ct);
            if (campaign is null) return Results.NotFound();
            campaign.Activate(DateTime.UtcNow);
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { campaign.Id, campaign.Status });
        });

        group.MapGet("/campaigns", async (
            NotificationDbContext db,
            CancellationToken ct) =>
        {
            var campaigns = await db.OutreachCampaigns
                .OrderByDescending(c => c.CreatedAt).Take(50)
                .Select(c => new { c.Id, c.Name, c.Type, c.Status, c.CreatedAt })
                .ToListAsync(ct);
            return Results.Ok(campaigns);
        });

        group.MapGet("/messages", async (
            Guid? campaignId,
            NotificationDbContext db,
            CancellationToken ct) =>
        {
            var query = db.Messages.AsQueryable();
            if (campaignId.HasValue)
                query = query.Where(m => m.CampaignId == campaignId.Value);
            var messages = await query.OrderByDescending(m => m.CreatedAt).Take(100)
                .Select(m => new { m.Id, m.CampaignId, m.Channel, m.Status, m.CreatedAt })
                .ToListAsync(ct);
            return Results.Ok(messages);
        });

        return app;
    }
}

public record CreateCampaignRequest(string Name, CampaignType Type, List<Guid> TargetPatientIds);
