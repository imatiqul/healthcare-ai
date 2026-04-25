using FluentAssertions;
using HealthQCopilot.Domain.PopulationHealth;
using Xunit;

namespace HealthQCopilot.Tests.Unit.Domain;

public class CareGapTests
{
    private static CareGap CreateGap(
        string patientId = "patient-001",
        string measureId = "HEDIS-A1C",
        string description = "Missing annual HbA1c screening") =>
        CareGap.Create(patientId, measureId, description);

    // ── Create ────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_SetsPropertiesAndRaisesCareGapIdentified()
    {
        var gap = CreateGap();

        gap.Id.Should().NotBeEmpty();
        gap.PatientId.Should().Be("patient-001");
        gap.MeasureId.Should().Be("HEDIS-A1C");
        gap.Description.Should().Be("Missing annual HbA1c screening");
        gap.Status.Should().Be(CareGapStatus.Open);
        gap.IdentifiedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
        gap.ResolvedAt.Should().BeNull();

        gap.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<CareGapIdentified>()
            .Which.PatientId.Should().Be("patient-001");
    }

    // ── Address ───────────────────────────────────────────────────────────────

    [Fact]
    public void Address_TransitionsToAddressedAndRaisesEvent()
    {
        var gap = CreateGap();
        gap.ClearDomainEvents();

        gap.Address();

        gap.Status.Should().Be(CareGapStatus.Addressed);
        gap.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<CareGapAddressed>()
            .Which.MeasureId.Should().Be("HEDIS-A1C");
    }

    [Fact]
    public void Address_CanBeCalledOnOpenGap()
    {
        var gap = CreateGap();
        gap.ClearDomainEvents();

        var act = () => gap.Address();

        act.Should().NotThrow();
        gap.Status.Should().Be(CareGapStatus.Addressed);
    }

    // ── Close ─────────────────────────────────────────────────────────────────

    [Fact]
    public void Close_TransitionsToClosedSetsResolvedAtAndRaisesEvent()
    {
        var gap = CreateGap();
        gap.Address();
        gap.ClearDomainEvents();

        gap.Close();

        gap.Status.Should().Be(CareGapStatus.Closed);
        gap.ResolvedAt.Should().NotBeNull()
            .And.Subject.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
        gap.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<CareGapClosed>()
            .Which.CareGapId.Should().Be(gap.Id);
    }

    [Fact]
    public void Close_CanBeCalledDirectlyFromOpen()
    {
        var gap = CreateGap();
        gap.ClearDomainEvents();

        gap.Close();

        gap.Status.Should().Be(CareGapStatus.Closed);
        gap.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<CareGapClosed>();
    }

    // ── Event record correctness ──────────────────────────────────────────────

    [Fact]
    public void DomainEvents_ContainCorrectPatientAndMeasureIds()
    {
        var gap = CareGap.Create("p-999", "MIPS-DM", "Diabetes management gap");

        var evt = gap.DomainEvents.OfType<CareGapIdentified>().Single();
        evt.PatientId.Should().Be("p-999");
        evt.MeasureId.Should().Be("MIPS-DM");
        evt.Description.Should().Be("Diabetes management gap");
    }
}
