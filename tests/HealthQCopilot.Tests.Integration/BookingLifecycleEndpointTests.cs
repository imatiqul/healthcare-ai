using System.Net;
using System.Net.Http.Json;
using HealthQCopilot.Tests.Integration.Fixtures;
using HealthQCopilot.Scheduling.Infrastructure;
using HealthQCopilot.Domain.Scheduling;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HealthQCopilot.Tests.Integration;

/// <summary>
/// Integration tests for Phase 30 booking lifecycle extensions:
/// rescheduling and cancellation of confirmed bookings.
/// </summary>
public class BookingLifecycleEndpointTests : IClassFixture<PostgresFixture>
{
    private readonly HttpClient _client;
    private readonly ServiceWebApplicationFactory<SchedulingDbContext, SchedulingDbContext> _factory;

    public BookingLifecycleEndpointTests(PostgresFixture postgres)
    {
        _factory = new ServiceWebApplicationFactory<SchedulingDbContext, SchedulingDbContext>(postgres);
        _client = _factory.CreateClient();
    }

    private async Task<(Guid bookingId, Guid originalSlotId)> CreateConfirmedBookingAsync()
    {
        var slotId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();
            var slot = Slot.Create(slotId, practitionerId.ToString(),
                DateTime.UtcNow.AddHours(2), DateTime.UtcNow.AddHours(3));
            db.Slots.Add(slot);
            await db.SaveChangesAsync();
        }

        await _client.PostAsJsonAsync($"/api/v1/scheduling/slots/{slotId}/reserve", new { PatientId = patientId });

        var bookingResponse = await _client.PostAsJsonAsync("/api/v1/scheduling/bookings",
            new { SlotId = slotId, PatientId = patientId, PractitionerId = practitionerId });

        bookingResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var booking = await bookingResponse.Content.ReadFromJsonAsync<BookingCreatedResponse>();
        return (booking!.Id, slotId);
    }

    [Fact]
    public async Task RescheduleBooking_ValidNewSlot_ReturnsOk()
    {
        var (bookingId, _) = await CreateConfirmedBookingAsync();

        // Create a new available slot
        var newSlotId = Guid.NewGuid();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();
            var newSlot = Slot.Create(newSlotId, "DR-RESCHEDULE",
                DateTime.UtcNow.AddDays(1).AddHours(9), DateTime.UtcNow.AddDays(1).AddHours(10));
            db.Slots.Add(newSlot);
            await db.SaveChangesAsync();
        }

        var response = await _client.PutAsJsonAsync(
            $"/api/v1/scheduling/bookings/{bookingId}/reschedule",
            new { NewSlotId = newSlotId });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain(bookingId.ToString());
    }

    [Fact]
    public async Task RescheduleBooking_SlotNotFound_Returns404()
    {
        var (bookingId, _) = await CreateConfirmedBookingAsync();

        var response = await _client.PutAsJsonAsync(
            $"/api/v1/scheduling/bookings/{bookingId}/reschedule",
            new { NewSlotId = Guid.NewGuid() });

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task RescheduleBooking_SlotAlreadyBooked_ReturnsConflict()
    {
        var (bookingId, _) = await CreateConfirmedBookingAsync();

        // Create a second slot that is already booked
        var bookedSlotId = Guid.NewGuid();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SchedulingDbContext>();
            var bookedSlot = Slot.Create(bookedSlotId, "DR-CONFLICT",
                DateTime.UtcNow.AddDays(2), DateTime.UtcNow.AddDays(2).AddHours(1));
            bookedSlot.Reserve("other-patient");
            bookedSlot.Book();
            db.Slots.Add(bookedSlot);
            await db.SaveChangesAsync();
        }

        var response = await _client.PutAsJsonAsync(
            $"/api/v1/scheduling/bookings/{bookingId}/reschedule",
            new { NewSlotId = bookedSlotId });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task CancelBooking_ConfirmedBooking_ReturnsNoContent()
    {
        var (bookingId, _) = await CreateConfirmedBookingAsync();

        var response = await _client.DeleteAsync($"/api/v1/scheduling/bookings/{bookingId}");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task CancelBooking_AlreadyCancelled_ReturnsBadRequest()
    {
        var (bookingId, _) = await CreateConfirmedBookingAsync();

        await _client.DeleteAsync($"/api/v1/scheduling/bookings/{bookingId}");

        var response2 = await _client.DeleteAsync($"/api/v1/scheduling/bookings/{bookingId}");

        response2.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CancelBooking_NotFound_Returns404()
    {
        var response = await _client.DeleteAsync($"/api/v1/scheduling/bookings/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private record BookingCreatedResponse(Guid Id, Guid SlotId, string PatientId);
}
