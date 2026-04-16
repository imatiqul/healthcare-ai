using FluentAssertions;
using HealthQCopilot.Domain.Scheduling;
using Xunit;

namespace HealthQCopilot.Tests.Unit.Domain;

public class SlotTests
{
    private static Slot CreateSlot() =>
        Slot.Create(Guid.NewGuid(), "dr-smith", DateTime.UtcNow.AddHours(1), DateTime.UtcNow.AddHours(2));

    [Fact]
    public void Create_ShouldSetAvailableStatus()
    {
        var slot = CreateSlot();

        slot.Status.Should().Be(SlotStatus.Available);
        slot.PractitionerId.Should().Be("dr-smith");
    }

    [Fact]
    public void Reserve_WhenAvailable_ShouldSucceed()
    {
        var slot = CreateSlot();

        var result = slot.Reserve("patient-1");

        result.IsSuccess.Should().BeTrue();
        slot.Status.Should().Be(SlotStatus.Reserved);
        slot.ReservedByPatientId.Should().Be("patient-1");
    }

    [Fact]
    public void Reserve_WhenAlreadyReserved_ShouldFail()
    {
        var slot = CreateSlot();
        slot.Reserve("patient-1");

        var result = slot.Reserve("patient-2");

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("not available");
    }

    [Fact]
    public void Book_WhenReserved_ShouldSucceed()
    {
        var slot = CreateSlot();
        slot.Reserve("patient-1");

        var result = slot.Book();

        result.IsSuccess.Should().BeTrue();
        slot.Status.Should().Be(SlotStatus.Booked);
    }

    [Fact]
    public void Book_WhenAvailable_ShouldFail()
    {
        var slot = CreateSlot();

        var result = slot.Book();

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("reserved");
    }

    [Fact]
    public void Release_ShouldResetToAvailable()
    {
        var slot = CreateSlot();
        slot.Reserve("patient-1");

        slot.Release();

        slot.Status.Should().Be(SlotStatus.Available);
        slot.ReservedByPatientId.Should().BeNull();
    }
}
