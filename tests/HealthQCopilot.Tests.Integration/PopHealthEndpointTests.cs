using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using HealthQCopilot.PopulationHealth.Infrastructure;
using HealthQCopilot.Tests.Integration.Fixtures;
using FluentAssertions;
using Xunit;

namespace HealthQCopilot.Tests.Integration;

public class PopHealthEndpointTests : IClassFixture<PostgresFixture>
{
    private readonly HttpClient _client;

    public PopHealthEndpointTests(PostgresFixture postgres)
    {
        var factory = new ServiceWebApplicationFactory<PopHealthDbContext, PopHealthDbContext>(postgres);
        _client = factory.CreateClient();
    }

    // ── Risk List ────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetRisks_Empty_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/population-health/risks");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task GetRisk_NotFound_Returns404()
    {
        var response = await _client.GetAsync($"/api/v1/population-health/risks/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetRisks_FilterByCritical_ReturnsOnlyCriticalRisks()
    {
        // Seed a Critical risk
        await _client.PostAsJsonAsync("/api/v1/population-health/risks/calculate", new
        {
            PatientId = Guid.NewGuid().ToString(),
            Conditions = new[] { "Diabetes", "CHF", "CKD", "COPD", "Hypertension" },
            TriageLevel = "P1_Immediate"
        });

        var response = await _client.GetAsync("/api/v1/population-health/risks?riskLevel=Critical");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.ValueKind.Should().Be(JsonValueKind.Array);
        foreach (var item in body.EnumerateArray())
        {
            item.GetProperty("level").GetString().Should().Be("Critical");
        }
    }

    // ── Risk Calculation ─────────────────────────────────────────────────────

    [Fact]
    public async Task CalculateRisk_ValidInput_ReturnsCreatedWithRiskScore()
    {
        var patientId = Guid.NewGuid().ToString();
        var response = await _client.PostAsJsonAsync("/api/v1/population-health/risks/calculate", new
        {
            PatientId = patientId,
            Conditions = new[] { "Diabetes", "Hypertension" },
            TriageLevel = (string?)null
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("patientId").GetString().Should().Be(patientId);
        doc.RootElement.GetProperty("level").GetString()
            .Should().BeOneOf("Low", "Moderate", "High", "Critical");
        var score = doc.RootElement.GetProperty("riskScore").GetDouble();
        score.Should().BeInRange(0.0, 1.0);
    }

    [Fact]
    public async Task CalculateRisk_HighAcuityConditions_ReturnsCriticalOrHigh()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/population-health/risks/calculate", new
        {
            PatientId = Guid.NewGuid().ToString(),
            Conditions = new[] { "Diabetes", "CHF", "CKD Stage 4", "COPD", "Hypertension" },
            TriageLevel = "P1_Immediate"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("level").GetString()
            .Should().BeOneOf("High", "Critical");
    }

    [Fact]
    public async Task CalculateRisk_MissingPatientId_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/population-health/risks/calculate", new
        {
            PatientId = "",
            Conditions = new[] { "Diabetes" }
        });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CalculateRisk_Recalculate_UpdatesExistingPatientRisk()
    {
        var patientId = Guid.NewGuid().ToString();

        // First calculation — low risk
        await _client.PostAsJsonAsync("/api/v1/population-health/risks/calculate", new
        {
            PatientId = patientId,
            Conditions = new[] { "Mild Hypertension" }
        });

        // Recalculate with worse conditions
        var response = await _client.PostAsJsonAsync("/api/v1/population-health/risks/calculate", new
        {
            PatientId = patientId,
            Conditions = new[] { "Mild Hypertension", "Diabetes", "CHF" }
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("patientId").GetString().Should().Be(patientId);
    }

    // ── Care Gaps ────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetCareGaps_Empty_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/population-health/care-gaps");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task GetCareGaps_FilterByOpen_ReturnsOnlyOpenGaps()
    {
        var response = await _client.GetAsync("/api/v1/population-health/care-gaps?status=Open");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        foreach (var gap in body.EnumerateArray())
        {
            gap.GetProperty("status").GetString().Should().Be("Open");
        }
    }

    [Fact]
    public async Task AddressCareGap_NotFound_Returns404()
    {
        var response = await _client.PostAsync(
            $"/api/v1/population-health/care-gaps/{Guid.NewGuid()}/address", null);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── Stats ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetStats_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/population-health/stats");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.TryGetProperty("highRiskPatients", out _).Should().BeTrue();
        doc.RootElement.TryGetProperty("totalPatients", out _).Should().BeTrue();
        doc.RootElement.TryGetProperty("openCareGaps", out _).Should().BeTrue();
        doc.RootElement.TryGetProperty("closedCareGaps", out _).Should().BeTrue();
    }

    [Fact]
    public async Task GetStats_AfterRiskCalculation_ReflectsNewData()
    {
        // Seed a risk first
        await _client.PostAsJsonAsync("/api/v1/population-health/risks/calculate", new
        {
            PatientId = Guid.NewGuid().ToString(),
            Conditions = new[] { "Diabetes", "CHF" }
        });

        var response = await _client.GetAsync("/api/v1/population-health/stats");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("totalPatients").GetInt32().Should().BeGreaterThanOrEqualTo(1);
    }

    // ── SDOH Assessment ───────────────────────────────────────────────────────

    [Fact]
    public async Task CreateSdohAssessment_ValidInput_ReturnsCreatedWithScore()
    {
        var patientId = Guid.NewGuid().ToString();
        var response = await _client.PostAsJsonAsync("/api/v1/population-health/sdoh", new
        {
            PatientId = patientId,
            DomainScores = new
            {
                HousingInstability = 2,
                FoodInsecurity = 1,
                Transportation = 0,
                SocialIsolation = 3,
                FinancialStrain = 2,
                Employment = 0,
                Education = 1,
                DigitalAccess = 0
            }
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("patientId").GetString().Should().Be(patientId);
        var totalScore = doc.RootElement.GetProperty("totalScore").GetInt32();
        totalScore.Should().BeInRange(0, 24);
        doc.RootElement.GetProperty("riskLevel").GetString()
            .Should().BeOneOf("Low", "Moderate", "High");
        var weight = doc.RootElement.GetProperty("compositeRiskWeight").GetDouble();
        weight.Should().BeInRange(0.0, 0.30);
    }

    [Fact]
    public async Task CreateSdohAssessment_MissingPatientId_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/population-health/sdoh", new
        {
            PatientId = "",
            DomainScores = new { HousingInstability = 1 }
        });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetSdohAssessment_AfterCreate_ReturnsLatest()
    {
        var patientId = Guid.NewGuid().ToString();
        await _client.PostAsJsonAsync("/api/v1/population-health/sdoh", new
        {
            PatientId = patientId,
            DomainScores = new
            {
                HousingInstability = 1,
                FoodInsecurity = 0,
                Transportation = 0,
                SocialIsolation = 1,
                FinancialStrain = 1,
                Employment = 0,
                Education = 0,
                DigitalAccess = 0
            }
        });

        var response = await _client.GetAsync($"/api/v1/population-health/sdoh/{patientId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("patientId").GetString().Should().Be(patientId);
    }

    [Fact]
    public async Task GetSdohAssessment_NotFound_Returns404()
    {
        var response = await _client.GetAsync($"/api/v1/population-health/sdoh/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── Drug Interaction Check ────────────────────────────────────────────────

    [Fact]
    public async Task CheckDrugInteractions_WithKnownInteraction_ReturnsMajorAlert()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/population-health/drug-interactions/check", new
        {
            Drugs = new[] { "warfarin", "aspirin" }
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("alertLevel").GetString()
            .Should().BeOneOf("Minor", "Moderate", "Major", "Contraindicated");
        doc.RootElement.GetProperty("interactionCount").GetInt32().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task CheckDrugInteractions_WithSafeCombination_ReturnsNoneAlert()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/population-health/drug-interactions/check", new
        {
            Drugs = new[] { "lisinopril", "atorvastatin" }
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("hasMajorInteraction").GetBoolean().Should().BeFalse();
        doc.RootElement.GetProperty("hasContraindication").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public async Task CheckDrugInteractions_SingleDrug_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/population-health/drug-interactions/check", new
        {
            Drugs = new[] { "warfarin" }
        });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CheckDrugInteractions_ThreeDrugs_ReturnsAllInteractions()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/population-health/drug-interactions/check", new
        {
            Drugs = new[] { "warfarin", "aspirin", "metformin" }
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.TryGetProperty("interactions", out var interactions).Should().BeTrue();
        interactions.ValueKind.Should().Be(JsonValueKind.Array);
    }

    // ── Cost Prediction ───────────────────────────────────────────────────────

    [Fact]
    public async Task PredictCost_ValidHighRiskInput_ReturnsCreatedPrediction()
    {
        var patientId = Guid.NewGuid().ToString();
        var response = await _client.PostAsJsonAsync("/api/v1/population-health/cost-prediction", new
        {
            PatientId = patientId,
            RiskLevel = "High",
            Conditions = new[] { "Diabetes", "CHF" },
            SdohWeight = 0.15
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("patientId").GetString().Should().Be(patientId);
        var predicted = doc.RootElement.GetProperty("predicted12mCostUsd").GetDouble();
        var lower = doc.RootElement.GetProperty("lowerBound95Usd").GetDouble();
        var upper = doc.RootElement.GetProperty("upperBound95Usd").GetDouble();
        lower.Should().BeLessThan(predicted);
        upper.Should().BeGreaterThan(predicted);
        doc.RootElement.GetProperty("costTier").GetString()
            .Should().BeOneOf("Low", "Moderate", "High", "VeryHigh");
    }

    [Fact]
    public async Task PredictCost_LowRiskPatient_ReturnsLowerCostTier()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/population-health/cost-prediction", new
        {
            PatientId = Guid.NewGuid().ToString(),
            RiskLevel = "Low",
            Conditions = Array.Empty<string>(),
            SdohWeight = 0.0
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("costTier").GetString()
            .Should().BeOneOf("Low", "Moderate");
    }

    [Fact]
    public async Task PredictCost_MissingPatientId_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/population-health/cost-prediction", new
        {
            PatientId = "",
            RiskLevel = "High",
            Conditions = new[] { "Diabetes" }
        });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
