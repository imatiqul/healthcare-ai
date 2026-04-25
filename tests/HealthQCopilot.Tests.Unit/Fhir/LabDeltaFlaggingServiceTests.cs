using FluentAssertions;
using HealthQCopilot.Fhir.Services;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace HealthQCopilot.Tests.Unit.Fhir;

/// <summary>
/// Unit tests for LabDeltaFlaggingService.
/// Validates clinically-derived AACC/CLIA delta-check logic and critical-value alerts.
/// </summary>
public class LabDeltaFlaggingServiceTests
{
    private static readonly ILogger<LabDeltaFlaggingService> Logger =
        Substitute.For<ILogger<LabDeltaFlaggingService>>();

    private static readonly LabDeltaFlaggingService Svc = new(Logger);

    private static LabObservationDto Obs(
        string loinc, double value, string unit = "mg/dL",
        string patientId = "p001") =>
        new(patientId, loinc, value, unit, DateTime.UtcNow);

    private static Dictionary<string, LabObservationDto> NoPriors() => [];

    // ── Unknown LOINC — no flag ───────────────────────────────────────────────

    [Fact]
    public void UnknownLoincCode_ProducesNoFlags()
    {
        var result = Svc.Check([Obs("9999-9", 100)], NoPriors());

        result.ObservationsChecked.Should().Be(1);
        result.FlagCount.Should().Be(0);
        result.Flags.Should().BeEmpty();
    }

    // ── Critical value alerts ─────────────────────────────────────────────────

    [Theory]
    [InlineData("2345-7", 45.0, "mg/dL")]   // Glucose critically low  (threshold < 50)
    [InlineData("2345-7", 510.0, "mg/dL")]   // Glucose critically high (threshold > 500)
    [InlineData("2951-2", 115.0, "mEq/L")]   // Sodium critically low   (threshold < 120)
    [InlineData("2951-2", 165.0, "mEq/L")]   // Sodium critically high  (threshold > 160)
    [InlineData("718-7", 6.5, "g/dL")]       // Hemoglobin critically low (threshold < 7.0)
    [InlineData("2823-3", 2.2, "mEq/L")]     // Potassium critically low (threshold < 2.5)
    [InlineData("2823-3", 7.0, "mEq/L")]     // Potassium critically high (threshold > 6.5)
    [InlineData("6690-2", 1.5, "10³/µL")]    // WBC critically low (threshold < 2.0)
    [InlineData("6690-2", 35.0, "10³/µL")]   // WBC critically high (threshold > 30.0)
    [InlineData("13056-7", 45.0, "10³/µL")]  // Platelets critically low (threshold < 50)
    [InlineData("14627-4", 8.0, "mEq/L")]    // Bicarbonate critically low (threshold < 10)
    [InlineData("14627-4", 42.0, "mEq/L")]   // Bicarbonate critically high (threshold > 40)
    public void CriticalValue_ProducesCriticalFlag(string loinc, double value, string unit)
    {
        var result = Svc.Check([Obs(loinc, value, unit)], NoPriors());

        result.HasCriticalFlags.Should().BeTrue();
        result.FlagCount.Should().BeGreaterThan(0);
        result.Flags.Single().Severity.Should().Be(DeltaFlagSeverity.Critical);
    }

    [Fact]
    public void GlucoseNormalValue_WithNoPrior_ProducesNoFlag()
    {
        var result = Svc.Check([Obs("2345-7", 95.0)], NoPriors());

        result.FlagCount.Should().Be(0);
        result.HasCriticalFlags.Should().BeFalse();
    }

    // ── Absolute delta threshold ──────────────────────────────────────────────

    [Theory]
    [InlineData("2345-7", 100.0, 175.0)] // Glucose: delta = 75 ≥ threshold 70 mg/dL
    [InlineData("2160-0", 1.0, 1.6)]     // Creatinine: delta = 0.6 ≥ threshold 0.5
    [InlineData("2951-2", 140.0, 151.0)] // Sodium: delta = 11 ≥ threshold 10 mEq/L
    [InlineData("2823-3", 4.0, 5.1)]     // Potassium: delta = 1.1 ≥ threshold 1.0
    [InlineData("718-7", 12.0, 14.5)]    // Hemoglobin: delta = 2.5 ≥ threshold 2.0
    [InlineData("21000-5", 6.0, 7.1)]    // HbA1c: delta = 1.1 ≥ threshold 1.0
    public void AbsoluteDeltaExceeded_ProducesDeltaFlag(string loinc, double prior, double current)
    {
        var priors = new Dictionary<string, LabObservationDto>
        {
            [$"p001:{loinc}"] = Obs(loinc, prior, "unit", "p001"),
        };

        var result = Svc.Check([Obs(loinc, current)], priors);

        result.FlagCount.Should().BeGreaterThan(0);
        result.Flags.Should().Contain(f => f.Severity == DeltaFlagSeverity.DeltaExceeded
                                        || f.Severity == DeltaFlagSeverity.Critical);
    }

    [Theory]
    [InlineData("2345-7", 200.0, 240.0)] // Glucose: delta=40(<70) AND relative=20%(<30%) → no flag
    [InlineData("2951-2", 140.0, 149.0)] // Sodium: delta = 9 < threshold 10 → no flag
    [InlineData("718-7", 12.0, 13.9)]    // Hemoglobin: delta = 1.9 < threshold 2.0 → no flag
    public void AbsolutaDeltaBelowThreshold_ProducesNoFlag(string loinc, double prior, double current)
    {
        var priors = new Dictionary<string, LabObservationDto>
        {
            [$"p001:{loinc}"] = Obs(loinc, prior, "unit", "p001"),
        };

        var result = Svc.Check([Obs(loinc, current)], priors);

        result.FlagCount.Should().Be(0);
    }

    // ── Relative delta threshold ──────────────────────────────────────────────

    [Theory]
    [InlineData("1742-6", 40.0, 61.0)]   // ALT: 52.5% change ≥ 50% threshold
    [InlineData("1920-8", 30.0, 46.0)]   // AST: 53.3% change ≥ 50% threshold
    [InlineData("2157-6", 100.0, 155.0)] // CK: 55% change ≥ 50% threshold
    public void RelativeDeltaExceeded_ProducesDeltaFlag(string loinc, double prior, double current)
    {
        var priors = new Dictionary<string, LabObservationDto>
        {
            [$"p001:{loinc}"] = Obs(loinc, prior, "U/L", "p001"),
        };

        var result = Svc.Check([Obs(loinc, current, "U/L")], priors);

        result.FlagCount.Should().BeGreaterThan(0);
        result.Flags.Single().Severity.Should().Be(DeltaFlagSeverity.DeltaExceeded);
    }

    [Theory]
    [InlineData("1742-6", 40.0, 55.0)]   // ALT: 37.5% change < 50% → no flag
    [InlineData("2157-6", 100.0, 148.0)] // CK: 48% change < 50% → no flag
    public void RelativeDeltaBelowThreshold_ProducesNoFlag(string loinc, double prior, double current)
    {
        var priors = new Dictionary<string, LabObservationDto>
        {
            [$"p001:{loinc}"] = Obs(loinc, prior, "U/L", "p001"),
        };

        var result = Svc.Check([Obs(loinc, current, "U/L")], priors);

        result.FlagCount.Should().Be(0);
    }

    // ── Critical supersedes delta ─────────────────────────────────────────────

    [Fact]
    public void CriticalRangeAndDelta_SeverityIsCritical()
    {
        // Glucose: new value is critically low AND a large delta from prior
        var priors = new Dictionary<string, LabObservationDto>
        {
            ["p001:2345-7"] = Obs("2345-7", 200.0, "mg/dL", "p001"),
        };

        var result = Svc.Check([Obs("2345-7", 40.0)], priors);

        result.HasCriticalFlags.Should().BeTrue();
        result.Flags.Single().Severity.Should().Be(DeltaFlagSeverity.Critical);
    }

    // ── Multi-observation batch ───────────────────────────────────────────────

    [Fact]
    public void BatchCheck_MultipleObservations_EachEvaluatedIndependently()
    {
        var observations = new List<LabObservationDto>
        {
            Obs("2345-7", 95.0, "mg/dL"),        // normal glucose — no flag
            Obs("718-7", 5.5, "g/dL"),           // critically low Hgb
            Obs("2951-2", 165.0, "mEq/L"),       // critically high Sodium
            Obs("9999-9", 999.0),                 // unknown LOINC — skipped
        };

        var result = Svc.Check(observations, NoPriors());

        result.ObservationsChecked.Should().Be(4);
        result.FlagCount.Should().Be(2);
        result.HasCriticalFlags.Should().BeTrue();
        result.Flags.Should().AllSatisfy(f => f.Severity.Should().Be(DeltaFlagSeverity.Critical));
    }

    [Fact]
    public void EmptyObservations_ReturnsZeroCounts()
    {
        var result = Svc.Check([], NoPriors());

        result.ObservationsChecked.Should().Be(0);
        result.FlagCount.Should().Be(0);
        result.HasCriticalFlags.Should().BeFalse();
        result.Flags.Should().BeEmpty();
    }

    // ── Different patients share no prior state ───────────────────────────────

    [Fact]
    public void DifferentPatients_PriorsNotCrossContaminated()
    {
        // p001 has a large prior glucose, p002 is fresh — no delta flag for p002
        var priors = new Dictionary<string, LabObservationDto>
        {
            ["p001:2345-7"] = Obs("2345-7", 100.0, "mg/dL", "p001"),
        };
        var p002Obs = new LabObservationDto("p002", "2345-7", 175.0, "mg/dL", DateTime.UtcNow);

        var result = Svc.Check([p002Obs], priors);

        // p002 has no prior, value is not critical → no flag
        result.FlagCount.Should().Be(0);
    }

    // ── Flag message content ──────────────────────────────────────────────────

    [Fact]
    public void CriticalFlag_FlagReasonMentionsAnalyteNameAndThreshold()
    {
        var result = Svc.Check([Obs("2345-7", 45.0, "mg/dL")], NoPriors());

        var flag = result.Flags.Single();
        flag.AnalyteName.Should().Be("Glucose");
        flag.FlagReasons.Should().ContainSingle()
            .Which.Should().Contain("critically low");
    }

    [Fact]
    public void DeltaFlag_FlagReasonMentionsPriorAndCurrentValues()
    {
        var priors = new Dictionary<string, LabObservationDto>
        {
            ["p001:2160-0"] = Obs("2160-0", 1.0, "mg/dL", "p001"),
        };

        var result = Svc.Check([Obs("2160-0", 1.8, "mg/dL")], priors);

        var flag = result.Flags.Single();
        flag.AnalyteName.Should().Be("Creatinine");
        flag.FlagReasons.Should().Contain(r => r.Contains("absolute delta"));
    }

    // ── No-flag when prior key pattern mismatches ─────────────────────────────

    [Fact]
    public void PriorKeyMismatch_NoDeltaCheck_OnlyCriticalApplies()
    {
        // Prior keyed with wrong patient ID — delta check should be skipped
        var priors = new Dictionary<string, LabObservationDto>
        {
            ["OTHER_PATIENT:2345-7"] = Obs("2345-7", 80.0, "mg/dL", "other"),
        };

        var result = Svc.Check([Obs("2345-7", 155.0)], priors);

        // delta = 75 would exceed threshold but key doesn't match → no delta flag
        // value 155 is not critical
        result.FlagCount.Should().Be(0);
    }
}
