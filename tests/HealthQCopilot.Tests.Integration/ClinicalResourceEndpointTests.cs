using System.Net;
using System.Net.Http.Json;
using HealthQCopilot.Fhir.Persistence;
using HealthQCopilot.Tests.Integration.Fixtures;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HealthQCopilot.Tests.Integration;

/// <summary>
/// Integration tests for Phase 30 FHIR clinical resource endpoints:
/// MedicationRequest, AllergyIntolerance, Condition, Immunization, DiagnosticReport, CareTeam.
/// All endpoints proxy to the configured FHIR server; the FhirServer HTTP client is stubbed
/// via ClinicalFhirWebApplicationFactory so no live FHIR server is required.
/// </summary>
public class ClinicalResourceEndpointTests : IClassFixture<PostgresFixture>
{
    private readonly HttpClient _client;

    public ClinicalResourceEndpointTests(PostgresFixture postgres)
    {
        var factory = new ClinicalFhirWebApplicationFactory(postgres);
        _client = factory.CreateClient();
    }

    // ── MedicationRequest ─────────────────────────────────────────────────

    [Fact]
    public async Task GetMedications_ByPatient_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/fhir/medications/patient-001");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Bundle");
    }

    [Fact]
    public async Task GetMedicationById_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/fhir/medications/resource/med-001");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("MedicationRequest");
    }

    [Fact]
    public async Task PostMedication_WithBody_ReturnsCreated()
    {
        var fhirBody = new StringContent(
            """{"resourceType":"MedicationRequest","status":"active","intent":"order"}""",
            System.Text.Encoding.UTF8, "application/fhir+json");

        var response = await _client.PostAsync("/api/v1/fhir/medications", fhirBody);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task PostMedication_EmptyBody_ReturnsBadRequest()
    {
        var fhirBody = new StringContent(string.Empty, System.Text.Encoding.UTF8, "application/fhir+json");

        var response = await _client.PostAsync("/api/v1/fhir/medications", fhirBody);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteMedication_ReturnsOk()
    {
        var response = await _client.DeleteAsync("/api/v1/fhir/medications/med-001");

        response.IsSuccessStatusCode.Should().BeTrue();
    }

    // ── AllergyIntolerance ────────────────────────────────────────────────

    [Fact]
    public async Task GetAllergies_ByPatient_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/fhir/allergies/patient-001");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Bundle");
    }

    [Fact]
    public async Task GetAllergyById_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/fhir/allergies/resource/allergy-001");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("AllergyIntolerance");
    }

    [Fact]
    public async Task PostAllergy_WithBody_ReturnsOk()
    {
        var fhirBody = new StringContent(
            """{"resourceType":"AllergyIntolerance","clinicalStatus":{"coding":[{"code":"active"}]}}""",
            System.Text.Encoding.UTF8, "application/fhir+json");

        var response = await _client.PostAsync("/api/v1/fhir/allergies", fhirBody);

        response.IsSuccessStatusCode.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteAllergy_ReturnsOk()
    {
        var response = await _client.DeleteAsync("/api/v1/fhir/allergies/allergy-001");

        response.IsSuccessStatusCode.Should().BeTrue();
    }

    // ── Condition ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetConditions_ByPatient_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/fhir/conditions/patient-001");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Bundle");
    }

    [Fact]
    public async Task GetConditions_WithStatusFilter_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/fhir/conditions/patient-001?clinicalStatus=active");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetConditionById_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/fhir/conditions/resource/cond-001");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Condition");
    }

    [Fact]
    public async Task PostCondition_WithBody_ReturnsOk()
    {
        var fhirBody = new StringContent(
            """{"resourceType":"Condition","clinicalStatus":{"coding":[{"code":"active"}]}}""",
            System.Text.Encoding.UTF8, "application/fhir+json");

        var response = await _client.PostAsync("/api/v1/fhir/conditions", fhirBody);

        response.IsSuccessStatusCode.Should().BeTrue();
    }

    // ── Immunization ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetImmunizations_ByPatient_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/fhir/immunizations/patient-001");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Bundle");
    }

    // ── DiagnosticReport ──────────────────────────────────────────────────

    [Fact]
    public async Task GetDiagnosticReports_ByPatient_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/fhir/diagnostic-reports/patient-001");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Bundle");
    }

    // ── CareTeam ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetCareTeams_ByPatient_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/fhir/care-teams/patient-001");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Bundle");
    }
}

/// <summary>
/// Application factory that stubs the FhirServer HTTP client with a handler
/// supporting all Phase 30 clinical resource routes.
/// </summary>
internal class ClinicalFhirWebApplicationFactory : ServiceWebApplicationFactory<FhirDbContext, FhirDbContext>
{
    public ClinicalFhirWebApplicationFactory(PostgresFixture postgres) : base(postgres) { }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureServices(services =>
        {
            services.AddHttpClient("FhirServer")
                .ConfigurePrimaryHttpMessageHandler(() => new ClinicalFakeFhirHandler());
        });
    }
}

internal class ClinicalFakeFhirHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var path = request.RequestUri?.PathAndQuery ?? "";
        var method = request.Method;

        // DELETE always succeeds
        if (method == HttpMethod.Delete)
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NoContent));

        var resourceType = path switch
        {
            var p when p.StartsWith("/MedicationRequest?") || p == "/MedicationRequest" => "MedicationRequest",
            var p when p.StartsWith("/MedicationRequest/") => "MedicationRequest",
            var p when p.StartsWith("/AllergyIntolerance?") || p == "/AllergyIntolerance" => "AllergyIntolerance",
            var p when p.StartsWith("/AllergyIntolerance/") => "AllergyIntolerance",
            var p when p.StartsWith("/Condition?") || p == "/Condition" => "Condition",
            var p when p.StartsWith("/Condition/") => "Condition",
            var p when p.StartsWith("/Immunization?") => "Immunization",
            var p when p.StartsWith("/DiagnosticReport?") => "DiagnosticReport",
            var p when p.StartsWith("/CareTeam?") => "CareTeam",
            _ => "Resource",
        };

        var isSearch = path.Contains('?') || (method == HttpMethod.Get && path.IndexOf('/', 1) < 0);
        var json = isSearch
            ? $"{{\"resourceType\":\"Bundle\",\"type\":\"searchset\",\"entry\":[{{\"resource\":{{\"resourceType\":\"{resourceType}\",\"id\":\"stub-1\"}}}}]}}"
            : $"{{\"resourceType\":\"{resourceType}\",\"id\":\"stub-1\"}}";

        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/fhir+json")
        };
        return Task.FromResult(response);
    }
}
