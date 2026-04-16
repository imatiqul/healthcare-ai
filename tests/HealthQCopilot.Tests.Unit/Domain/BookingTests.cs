using FluentAssertions;
using HealthQCopilot.Domain.Scheduling;
using Xunit;

namespace HealthQCopilot.Tests.Unit.Domain;

public class BookingTests
{
    [Fact]
    public void Create_ShouldSetProperties()
    {
        var slotId = Guid.NewGuid();
        var appointmentTime = DateTime.UtcNow.AddHours(2);

        var booking = Booking.Create(slotId, "patient-1", "dr-smith", appointmentTime);

        booking.Id.Should().NotBeEmpty();
        booking.SlotId.Should().Be(slotId);
        booking.PatientId.Should().Be("patient-1");
        booking.PractitionerId.Should().Be("dr-smith");
        booking.AppointmentTime.Should().Be(appointmentTime);
        booking.FhirAppointmentId.Should().BeNull();
    }

    [Fact]
    public void LinkFhirAppointment_ShouldSetFhirId()
    {
        var booking = Booking.Create(Guid.NewGuid(), "patient-1", "dr-smith", DateTime.UtcNow);

        booking.LinkFhirAppointment("Appointment/123");

        booking.FhirAppointmentId.Should().Be("Appointment/123");
    }
}
