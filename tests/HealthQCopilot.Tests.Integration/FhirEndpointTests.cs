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

public class FhirEndpointTests : IClassFixture<PostgresFixture>
{
    private readonly HttpClient _client;

    public FhirEndpointTests(PostgresFixture postgres)
    {
        var factory = new FhirWebApplicationFactory(postgres);
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetPatientById_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/fhir/patients/test-patient-1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("test-patient-1");
    }

    [Fact]
    public async Task SearchPatients_ByName_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/fhir/patients?name=John");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetEncounters_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/fhir/encounters/test-patient-1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAppointments_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/fhir/appointments/test-patient-1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task PostEvents_ReturnsOk()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/fhir/events", new { });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<EventResponse>();
        body!.Status.Should().Be("received");
    }

    private record EventResponse(string Status);
}

/// <summary>
/// Custom factory for FHIR tests that stubs the external FHIR HTTP client
/// so tests don't require a running HAPI FHIR server.
/// </summary>
internal class FhirWebApplicationFactory : ServiceWebApplicationFactory<FhirDbContext, FhirDbContext>
{
    public FhirWebApplicationFactory(PostgresFixture postgres) : base(postgres) { }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);

        builder.ConfigureServices(services =>
        {
            // Replace the named "FhirServer" HttpClient with a stub handler
            services.AddHttpClient("FhirServer")
                .ConfigurePrimaryHttpMessageHandler(() => new FakeFhirHandler());
        });
    }
}

/// <summary>
/// Stub HTTP handler that returns valid FHIR-like JSON responses.
/// </summary>
internal class FakeFhirHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var path = request.RequestUri?.PathAndQuery ?? "";
        var json = path switch
        {
            var p when p.StartsWith("/Patient/") =>
                $"{{\"resourceType\":\"Patient\",\"id\":\"{p.Replace("/Patient/", "")}\"}}",
            var p when p.StartsWith("/Patient") =>
                "{\"resourceType\":\"Bundle\",\"type\":\"searchset\",\"entry\":[]}",
            var p when p.StartsWith("/Encounter") =>
                "{\"resourceType\":\"Bundle\",\"type\":\"searchset\",\"entry\":[]}",
            var p when p.StartsWith("/Appointment") && request.Method == HttpMethod.Post =>
                "{\"resourceType\":\"Appointment\",\"id\":\"new-1\",\"status\":\"booked\"}",
            var p when p.StartsWith("/Appointment") =>
                "{\"resourceType\":\"Bundle\",\"type\":\"searchset\",\"entry\":[]}",
            _ => "{}"
        };

        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/fhir+json")
        };
        return Task.FromResult(response);
    }
}
