using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using HealthQCopilot.Domain.Agents;
using HealthQCopilot.Tests.Integration.Fixtures;
using HealthQCopilot.Agents.Infrastructure;
using FluentAssertions;
using Xunit;

using HealthQCopilot.Agents.Services;

namespace HealthQCopilot.Tests.Integration;

public class AgentEndpointTests : IClassFixture<PostgresFixture>
{
    private readonly HttpClient _client;

    public AgentEndpointTests(PostgresFixture postgres)
    {
        var factory = new ServiceWebApplicationFactory<TriageOrchestrator, AgentDbContext>(postgres);
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task StartTriage_CriticalSymptoms_ReturnsP1()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/agents/triage", new
        {
            SessionId = Guid.NewGuid(),
            TranscriptText = "Patient reports severe chest pain and difficulty breathing"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("assignedLevel").GetInt32()
            .Should().Be((int)TriageLevel.P1_Immediate);
        doc.RootElement.GetProperty("status").GetInt32()
            .Should().Be((int)WorkflowStatus.AwaitingHumanReview);
    }

    [Fact]
    public async Task StartTriage_NonUrgent_ReturnsP4()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/agents/triage", new
        {
            SessionId = Guid.NewGuid(),
            TranscriptText = "Patient requests prescription refill for multivitamins"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("assignedLevel").GetInt32()
            .Should().Be((int)TriageLevel.P4_NonUrgent);
        doc.RootElement.GetProperty("status").GetInt32()
            .Should().Be((int)WorkflowStatus.Completed);
    }

    [Fact]
    public async Task GetTriage_AfterCreate_ReturnsWorkflow()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/v1/agents/triage", new
        {
            SessionId = Guid.NewGuid(),
            TranscriptText = "Patient has moderate pain in the lower back"
        });
        var doc = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync());
        var id = doc.RootElement.GetProperty("id").GetGuid();

        var response = await _client.GetAsync($"/api/v1/agents/triage/{id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ApproveEscalation_P1Triage_CompletesWorkflow()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/v1/agents/triage", new
        {
            SessionId = Guid.NewGuid(),
            TranscriptText = "Patient is unresponsive after cardiac arrest"
        });
        var doc = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync());
        var id = doc.RootElement.GetProperty("id").GetGuid();

        var approveResponse = await _client.PostAsync(
            $"/api/v1/agents/triage/{id}/approve", null);

        approveResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = JsonDocument.Parse(await approveResponse.Content.ReadAsStringAsync());
        body.RootElement.GetProperty("status").GetInt32()
            .Should().Be((int)WorkflowStatus.Completed);
    }

    [Fact]
    public async Task ListTriageWorkflows_ReturnsOk()
    {
        await _client.PostAsJsonAsync("/api/v1/agents/triage", new
        {
            SessionId = Guid.NewGuid(),
            TranscriptText = "General checkup"
        });

        var response = await _client.GetAsync("/api/v1/agents/triage");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetDecisions_ReturnsAgentDecisions()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/v1/agents/triage", new
        {
            SessionId = Guid.NewGuid(),
            TranscriptText = "Patient has high fever and fracture"
        });
        var doc = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync());
        var id = doc.RootElement.GetProperty("id").GetGuid();

        var response = await _client.GetAsync($"/api/v1/agents/decisions/{id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── Phase 28 — ML Confidence endpoint tests ──────────────────────────────

    [Fact]
    public async Task ComputeMlConfidence_ValidProbability_ReturnsOk()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/agents/decisions/ml-confidence", new
        {
            Probability = 0.72,
            FeatureValues = new double[] { }
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("confidenceInterval").ValueKind.Should().NotBe(JsonValueKind.Undefined);
    }

    [Fact]
    public async Task ComputeMlConfidence_WithFeatures_ReturnsFeatureImportance()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/agents/decisions/ml-confidence", new
        {
            Probability = 0.85,
            FeatureValues = new[] { 0.9, 0.4, 0.7, 0.2 }
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("featureImportance").ValueKind.Should().NotBe(JsonValueKind.Null);
    }
}
