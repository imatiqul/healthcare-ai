using HealthQCopilot.Domain.Primitives;

namespace HealthQCopilot.Domain.Scheduling;

public class Booking : AggregateRoot<Guid>
{
    public Guid SlotId { get; private set; }
    public string PatientId { get; private set; } = string.Empty;
    public string PractitionerId { get; private set; } = string.Empty;
    public DateTime AppointmentTime { get; private set; }
    public string? FhirAppointmentId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private Booking() { }

    public static Booking Create(Guid slotId, string patientId, string practitionerId, DateTime appointmentTime)
    {
        return new Booking
        {
            Id = Guid.NewGuid(),
            SlotId = slotId,
            PatientId = patientId,
            PractitionerId = practitionerId,
            AppointmentTime = appointmentTime,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void LinkFhirAppointment(string fhirAppointmentId) =>
        FhirAppointmentId = fhirAppointmentId;
}
