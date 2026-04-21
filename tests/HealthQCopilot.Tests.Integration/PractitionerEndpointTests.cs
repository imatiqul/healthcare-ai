using System.Net;
using System.Net.Http.Json;
using HealthQCopilot.Tests.Integration.Fixtures;
using HealthQCopilot.Scheduling.Infrastructure;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HealthQCopilot.Tests.Integration;

/// <summary>
/// Integration tests for the Phase 30 Practitioner management endpoints.
/// CRUD operations against the practitioners table via SchedulingDbContext.
/// </summary>
public class PractitionerEndpointTests : IClassFixture<PostgresFixture>
{
    private readonly HttpClient _client;
    private readonly ServiceWebApplicationFactory<SchedulingDbContext, SchedulingDbContext> _factory;

    public PractitionerEndpointTests(PostgresFixture postgres)
    {
        _factory = new ServiceWebApplicationFactory<SchedulingDbContext, SchedulingDbContext>(postgres);
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task GetPractitioners_Empty_ReturnsOkWithEmptyArray()
    {
        var response = await _client.GetAsync("/api/v1/scheduling/practitioners/");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        (body.Contains("[]") || body.Contains("\"id\"")).Should().BeTrue();
    }

    [Fact]
    public async Task CreatePractitioner_ValidRequest_ReturnsCreated()
    {
        var request = new
        {
            PractitionerId = $"DR-TEST-{Guid.NewGuid():N}",
            Name = "Dr. Test Practitioner",
            Specialty = "General Practice",
            Email = "test@healthq.local",
            AvailabilityStart = "09:00",
            AvailabilityEnd = "17:00",
            TimeZoneId = "UTC",
        };

        var response = await _client.PostAsJsonAsync("/api/v1/scheduling/practitioners/", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("id");
        body.Should().Contain(request.Name);
    }

    [Fact]
    public async Task CreatePractitioner_DuplicateId_ReturnsConflict()
    {
        var practitionerId = $"DR-DUP-{Guid.NewGuid():N}";
        var request = new
        {
            PractitionerId = practitionerId,
            Name = "Dr. Duplicate",
            Specialty = "Cardiology",
            Email = "dup@healthq.local",
            AvailabilityStart = "08:00",
            AvailabilityEnd = "16:00",
            TimeZoneId = "UTC",
        };

        await _client.PostAsJsonAsync("/api/v1/scheduling/practitioners/", request);
        var response2 = await _client.PostAsJsonAsync("/api/v1/scheduling/practitioners/", request);

        response2.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task GetPractitionerById_AfterCreate_ReturnsOk()
    {
        var practitionerId = $"DR-GET-{Guid.NewGuid():N}";
        var createRequest = new
        {
            PractitionerId = practitionerId,
            Name = "Dr. Getable",
            Specialty = "Neurology",
            Email = "getable@healthq.local",
            AvailabilityStart = "09:00",
            AvailabilityEnd = "18:00",
            TimeZoneId = "UTC",
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/scheduling/practitioners/", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<CreatedPractitionerResponse>();
        created.Should().NotBeNull();

        var getResponse = await _client.GetAsync($"/api/v1/scheduling/practitioners/{created!.Id}");

        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await getResponse.Content.ReadAsStringAsync();
        body.Should().Contain("Dr. Getable");
    }

    [Fact]
    public async Task UpdatePractitioner_ChangeName_ReturnsOk()
    {
        var practitionerId = $"DR-UPD-{Guid.NewGuid():N}";
        var createRequest = new
        {
            PractitionerId = practitionerId,
            Name = "Dr. Original",
            Specialty = "Pediatrics",
            Email = "original@healthq.local",
            AvailabilityStart = "09:00",
            AvailabilityEnd = "17:00",
            TimeZoneId = "UTC",
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/scheduling/practitioners/", createRequest);
        var created = await createResponse.Content.ReadFromJsonAsync<CreatedPractitionerResponse>();

        var updateRequest = new
        {
            Name = "Dr. Updated",
            Specialty = "Pediatrics",
            Email = "updated@healthq.local",
            AvailabilityStart = "09:00",
            AvailabilityEnd = "17:00",
            TimeZoneId = "UTC",
        };

        var updateResponse = await _client.PutAsJsonAsync(
            $"/api/v1/scheduling/practitioners/{created!.Id}", updateRequest);

        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await updateResponse.Content.ReadAsStringAsync();
        body.Should().Contain("Dr. Updated");
    }

    [Fact]
    public async Task DeactivatePractitioner_ReturnsNoContent()
    {
        var practitionerId = $"DR-DEL-{Guid.NewGuid():N}";
        var createRequest = new
        {
            PractitionerId = practitionerId,
            Name = "Dr. Deactivatable",
            Specialty = "Oncology",
            Email = "deact@healthq.local",
            AvailabilityStart = "09:00",
            AvailabilityEnd = "17:00",
            TimeZoneId = "UTC",
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/scheduling/practitioners/", createRequest);
        var created = await createResponse.Content.ReadFromJsonAsync<CreatedPractitionerResponse>();

        var deleteResponse = await _client.DeleteAsync($"/api/v1/scheduling/practitioners/{created!.Id}");

        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task GetPractitionerById_NotFound_Returns404()
    {
        var response = await _client.GetAsync($"/api/v1/scheduling/practitioners/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private record CreatedPractitionerResponse(Guid Id, string PractitionerId, string Name);
}
