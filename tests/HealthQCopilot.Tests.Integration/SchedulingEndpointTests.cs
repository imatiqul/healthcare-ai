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

    // ── Helper ───────────────────────────────────────────────────────────────

    private async Task<Guid> SeedSlotAsync(DateTime? start = null, DateTime? end = null)
    {
        var slotId = Guid.NewGuid();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();
        var slot = Slot.Create(slotId, Guid.NewGuid().ToString(),
            start ?? DateTime.UtcNow.AddHours(1),
            end ?? DateTime.UtcNow.AddHours(2));
        db.Slots.Add(slot);
        await db.SaveChangesAsync();
        return slotId;
    }

    // ── Slot Endpoints ────────────────────────────────────────────────────────

    [Fact]
    public async Task GetSlots_Empty_ReturnsOkArray()
    {
        var response = await _client.GetAsync("/api/v1/scheduling/slots");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task GetSlots_AfterSeed_ReturnsSlotInList()
    {
        await SeedSlotAsync();
        var response = await _client.GetAsync("/api/v1/scheduling/slots");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetArrayLength().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task ReserveSlot_ExistingSlot_ReturnsOk()
    {
        var slotId = await SeedSlotAsync();

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/scheduling/slots/{slotId}/reserve",
            new { PatientId = Guid.NewGuid() });

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

    [Fact]
    public async Task CancelReservation_AfterReserve_ReturnsOk()
    {
        var slotId = await SeedSlotAsync();
        var patientId = Guid.NewGuid();

        await _client.PostAsJsonAsync(
            $"/api/v1/scheduling/slots/{slotId}/reserve",
            new { PatientId = patientId });

        var response = await _client.DeleteAsync(
            $"/api/v1/scheduling/slots/{slotId}/reserve");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── Booking Endpoints ─────────────────────────────────────────────────────

    [Fact]
    public async Task CreateBooking_AfterReserve_ReturnsCreated()
    {
        var slotId = await SeedSlotAsync();
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();

        await _client.PostAsJsonAsync(
            $"/api/v1/scheduling/slots/{slotId}/reserve",
            new { PatientId = patientId });

        var response = await _client.PostAsJsonAsync("/api/v1/scheduling/bookings",
            new { SlotId = slotId, PatientId = patientId, PractitionerId = practitionerId });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("id").GetGuid().Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetBooking_AfterCreate_ReturnsOk()
    {
        var slotId = await SeedSlotAsync();
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();

        await _client.PostAsJsonAsync(
            $"/api/v1/scheduling/slots/{slotId}/reserve",
            new { PatientId = patientId });

        var bookResponse = await _client.PostAsJsonAsync("/api/v1/scheduling/bookings",
            new { SlotId = slotId, PatientId = patientId, PractitionerId = practitionerId });
        var doc = JsonDocument.Parse(await bookResponse.Content.ReadAsStringAsync());
        var bookingId = doc.RootElement.GetProperty("id").GetGuid();

        var response = await _client.GetAsync($"/api/v1/scheduling/bookings/{bookingId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        body.RootElement.GetProperty("id").GetGuid().Should().Be(bookingId);
    }

    [Fact]
    public async Task ListBookings_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/scheduling/bookings");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task CancelBooking_AfterCreate_ReturnsOk()
    {
        var slotId = await SeedSlotAsync();
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();

        await _client.PostAsJsonAsync(
            $"/api/v1/scheduling/slots/{slotId}/reserve",
            new { PatientId = patientId });

        var bookResponse = await _client.PostAsJsonAsync("/api/v1/scheduling/bookings",
            new { SlotId = slotId, PatientId = patientId, PractitionerId = practitionerId });
        var doc = JsonDocument.Parse(await bookResponse.Content.ReadAsStringAsync());
        var bookingId = doc.RootElement.GetProperty("id").GetGuid();

        var cancelResponse = await _client.DeleteAsync($"/api/v1/scheduling/bookings/{bookingId}");
        cancelResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CancelBooking_NotFound_Returns404()
    {
        var response = await _client.DeleteAsync($"/api/v1/scheduling/bookings/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetStats_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/scheduling/stats");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.TryGetProperty("availableSlotsToday", out _).Should().BeTrue();
        doc.RootElement.TryGetProperty("bookedToday", out _).Should().BeTrue();
    }

    // ── Waitlist ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task AddToWaitlist_ReturnsCreated()
    {
        var patientId = Guid.NewGuid().ToString();
        var response = await _client.PostAsJsonAsync("/api/v1/scheduling/waitlist/", new
        {
            PatientId = patientId,
            PractitionerId = Guid.NewGuid().ToString(),
            Specialty = "Cardiology",
            PreferredDate = DateTime.UtcNow.AddDays(7).ToString("O")
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task GetWaitlistByPatient_AfterAdd_ReturnsEntries()
    {
        var patientId = Guid.NewGuid().ToString();
        await _client.PostAsJsonAsync("/api/v1/scheduling/waitlist/", new
        {
            PatientId = patientId,
            PractitionerId = Guid.NewGuid().ToString(),
            Specialty = "Neurology",
            PreferredDate = DateTime.UtcNow.AddDays(14).ToString("O")
        });

        var response = await _client.GetAsync($"/api/v1/scheduling/waitlist/{patientId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.ValueKind.Should().Be(JsonValueKind.Array);
        body.GetArrayLength().Should().BeGreaterThan(0);
    }
}
