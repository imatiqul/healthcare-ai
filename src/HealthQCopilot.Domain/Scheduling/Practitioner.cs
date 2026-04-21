namespace HealthQCopilot.Domain.Scheduling;

/// <summary>
/// Represents a clinical practitioner whose schedule is managed by the Scheduling service.
/// PractitionerId holds the external NPI or internal identifier used in FHIR resources and slots.
/// </summary>
public sealed class Practitioner
{
    public Guid Id { get; private set; }
    public string PractitionerId { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string Specialty { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public TimeOnly AvailabilityStart { get; private set; }
    public TimeOnly AvailabilityEnd { get; private set; }
    public string TimeZoneId { get; private set; } = "UTC";
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private Practitioner() { }

    public static Practitioner Create(
        string practitionerId,
        string name,
        string specialty,
        string email,
        TimeOnly availabilityStart,
        TimeOnly availabilityEnd,
        string timeZoneId = "UTC")
    {
        return new Practitioner
        {
            Id = Guid.NewGuid(),
            PractitionerId = practitionerId,
            Name = name,
            Specialty = specialty,
            Email = email,
            AvailabilityStart = availabilityStart,
            AvailabilityEnd = availabilityEnd,
            TimeZoneId = timeZoneId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };
    }

    public void Update(
        string name,
        string specialty,
        string email,
        TimeOnly availabilityStart,
        TimeOnly availabilityEnd,
        string timeZoneId)
    {
        Name = name;
        Specialty = specialty;
        Email = email;
        AvailabilityStart = availabilityStart;
        AvailabilityEnd = availabilityEnd;
        TimeZoneId = timeZoneId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate() { IsActive = false; UpdatedAt = DateTime.UtcNow; }
    public void Activate() { IsActive = true; UpdatedAt = DateTime.UtcNow; }
}
