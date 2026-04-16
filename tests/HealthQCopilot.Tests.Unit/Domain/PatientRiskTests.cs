using FluentAssertions;
using HealthQCopilot.Domain.PopulationHealth;
using Xunit;

namespace HealthQCopilot.Tests.Unit.Domain;

public class PatientRiskTests
{
    [Fact]
    public void Create_ShouldSetAllProperties()
    {
        var factors = new List<string> { "Diabetes", "Hypertension" };

        var risk = PatientRisk.Create("patient-1", RiskLevel.High, 0.85, "v2.1", factors);

        risk.Id.Should().NotBeEmpty();
        risk.PatientId.Should().Be("patient-1");
        risk.Level.Should().Be(RiskLevel.High);
        risk.RiskScore.Should().Be(0.85);
        risk.ModelVersion.Should().Be("v2.1");
        risk.RiskFactors.Should().BeEquivalentTo(factors);
        risk.AssessedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
    }

    [Theory]
    [InlineData(RiskLevel.Low)]
    [InlineData(RiskLevel.Moderate)]
    [InlineData(RiskLevel.High)]
    [InlineData(RiskLevel.Critical)]
    public void Create_ShouldAcceptAllRiskLevels(RiskLevel level)
    {
        var risk = PatientRisk.Create("patient-1", level, 0.5, "v1", []);

        risk.Level.Should().Be(level);
    }
}
