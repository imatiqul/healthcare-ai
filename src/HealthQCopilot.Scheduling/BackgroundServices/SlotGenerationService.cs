using HealthQCopilot.Domain.Scheduling;
using HealthQCopilot.Scheduling.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace HealthQCopilot.Scheduling.BackgroundServices;

/// <summary>
/// Ensures appointment slots exist for the next 7 days for all active practitioners.
/// Practitioners are loaded from the database; falls back to default seed data when the
/// practitioners table is empty so the service remains functional on a fresh deployment.
/// Runs on startup and then once per hour.
/// </summary>
public sealed class SlotGenerationService : BackgroundService
{
    private const int DaysAhead = 7;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SlotGenerationService> _logger;

    public SlotGenerationService(IServiceScopeFactory scopeFactory, ILogger<SlotGenerationService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        // Run immediately on startup, then every hour
        while (!ct.IsCancellationRequested)
        {
            await GenerateSlotsAsync(ct);
            try
            {
                await Task.Delay(TimeSpan.FromHours(1), ct);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task GenerateSlotsAsync(CancellationToken ct)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();

            // Load active practitioners from database; seed defaults if the table is empty.
            var practitioners = await db.Practitioners
                .Where(p => p.IsActive)
                .ToListAsync(ct);

            if (practitioners.Count == 0)
            {
                await SeedDefaultPractitionersAsync(db, ct);
                practitioners = await db.Practitioners.Where(p => p.IsActive).ToListAsync(ct);
            }

            var today = DateTime.UtcNow.Date;
            var newSlots = new List<Slot>();

            foreach (var practitioner in practitioners)
            {
                var availStart = practitioner.AvailabilityStart.Hour;
                var availEnd = practitioner.AvailabilityEnd.Hour;

                for (var dayOffset = 0; dayOffset < DaysAhead; dayOffset++)
                {
                    var date = today.AddDays(dayOffset);

                    var hasSlots = await db.Slots
                        .AnyAsync(s => s.PractitionerId == practitioner.PractitionerId
                            && s.StartTime >= date
                            && s.StartTime < date.AddDays(1), ct);

                    if (hasSlots) continue;

                    for (var hour = availStart; hour < availEnd; hour++)
                    {
                        newSlots.Add(Slot.Create(Guid.NewGuid(), practitioner.PractitionerId,
                            date.AddHours(hour), date.AddHours(hour).AddMinutes(30)));
                        newSlots.Add(Slot.Create(Guid.NewGuid(), practitioner.PractitionerId,
                            date.AddHours(hour).AddMinutes(30), date.AddHours(hour + 1)));
                    }
                }
            }

            if (newSlots.Count > 0)
            {
                db.Slots.AddRange(newSlots);
                await db.SaveChangesAsync(ct);
                _logger.LogInformation("Generated {Count} new appointment slots for the next {Days} days", newSlots.Count, DaysAhead);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error generating appointment slots");
        }
    }

    private static async Task SeedDefaultPractitionersAsync(SchedulingDbContext db, CancellationToken ct)
    {
        var defaults = new[]
        {
            Practitioner.Create("DR-001", "Dr. Alice Johnson", "Internal Medicine", "alice.johnson@healthq.local",
                new TimeOnly(9, 0), new TimeOnly(17, 0)),
            Practitioner.Create("DR-002", "Dr. Bob Williams", "Cardiology", "bob.williams@healthq.local",
                new TimeOnly(9, 0), new TimeOnly(17, 0)),
            Practitioner.Create("DR-003", "Dr. Carol Lee", "Pediatrics", "carol.lee@healthq.local",
                new TimeOnly(9, 0), new TimeOnly(17, 0)),
        };
        db.Practitioners.AddRange(defaults);
        await db.SaveChangesAsync(ct);
    }
}
