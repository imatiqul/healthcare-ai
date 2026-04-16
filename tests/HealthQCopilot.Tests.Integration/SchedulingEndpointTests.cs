using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using HealthQCopilot.Tests.Integration.Fixtures;
using HealthQCopilot.Scheduling.Infrastructure;
using HealthQCopilot.Domain.Scheduling;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HealthQCopilot.Tests.Integration;

public class SchedulingEndpointTests : IClassFixture<PostgresFixture>
{
    private readonly HttpClient _client;
    private readonly ServiceWebApplicationFactory<SchedulingDbContext, SchedulingDbContext> _factory;

    public SchedulingEndpointTests(PostgresFixture postgres)
    {
        _factory = new ServiceWebApplicationFactory<SchedulingDbContext, SchedulingDbContext>(postgres);
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task GetSlots_Empty_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/scheduling/slots");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ReserveSlot_ExistingSlot_ReturnsOk()
    {
        var slotId = Guid.NewGuid();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();
            var slot = Slot.Create(slotId, Guid.NewGuid().ToString(),
                DateTime.UtcNow.AddHours(1), DateTime.UtcNow.AddHours(2));
            db.Slots.Add(slot);
            await db.SaveChangesAsync();
        }

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/scheduling/slots/{slotId}/reserve",
            new { PatientId = Guid.NewGuid() });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateBooking_AfterReserve_ReturnsCreated()
    {
        var slotId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();
            var slot = Slot.Create(slotId, practitionerId.ToString(),
                DateTime.UtcNow.AddHours(1), DateTime.UtcNow.AddHours(2));
            db.Slots.Add(slot);
            await db.SaveChangesAsync();
        }

        await _client.PostAsJsonAsync(
            $"/api/v1/scheduling/slots/{slotId}/reserve",
            new { PatientId = patientId });

        var response = await _client.PostAsJsonAsync("/api/v1/scheduling/bookings",
            new { SlotId = slotId, PatientId = patientId, PractitionerId = practitionerId });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task GetBooking_AfterCreate_ReturnsOk()
    {
        var slotId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();
            var slot = Slot.Create(slotId, practitionerId.ToString(),
                DateTime.UtcNow.AddHours(1), DateTime.UtcNow.AddHours(2));
            db.Slots.Add(slot);
            await db.SaveChangesAsync();
        }

        await _client.PostAsJsonAsync(
            $"/api/v1/scheduling/slots/{slotId}/reserve",
            new { PatientId = patientId });

        var bookResponse = await _client.PostAsJsonAsync("/api/v1/scheduling/bookings",
            new { SlotId = slotId, PatientId = patientId, PractitionerId = practitionerId });
        var doc = JsonDocument.Parse(await bookResponse.Content.ReadAsStringAsync());
        var bookingId = doc.RootElement.GetProperty("id").GetGuid();

        var response = await _client.GetAsync($"/api/v1/scheduling/bookings/{bookingId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ReserveSlot_NotFound_Returns404()
    {
        var response = await _client.PostAsJsonAsync(
            $"/api/v1/scheduling/slots/{Guid.NewGuid()}/reserve",
            new { PatientId = Guid.NewGuid() });

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
