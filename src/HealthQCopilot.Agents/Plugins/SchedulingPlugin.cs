using System.ComponentModel;
using Microsoft.SemanticKernel;

namespace HealthQCopilot.Agents.Plugins;

/// <summary>
/// Semantic Kernel plugin that wraps the Scheduling service HTTP API so the AI
/// agent can query available appointment slots, find practitioners by specialty,
/// and retrieve booking details during care-coordination planning.
/// </summary>
public sealed class SchedulingPlugin(
    IHttpClientFactory httpClientFactory,
    ILogger<SchedulingPlugin> logger)
{
    private HttpClient SchedulingClient => httpClientFactory.CreateClient("scheduling-service");

    // ── Available slots ────────────────────────────────────────────────────────

    /// <summary>Query available appointment slots.</summary>
    [KernelFunction("get_available_slots")]
    [Description(
        "Returns available appointment slots from the scheduling service. " +
        "Optionally filter by date (ISO format: yyyy-MM-dd) and/or practitioner ID. " +
        "Returns up to 100 slots ordered by start time. " +
        "Use this to find when a patient can be scheduled for an appointment.")]
    public async Task<string> GetAvailableSlotsAsync(
        [Description("Date to search for available slots (ISO format: yyyy-MM-dd). Leave empty for all upcoming slots.")]
        string? date = null,
        [Description("Practitioner GUID to filter slots for a specific provider. Leave empty for any practitioner.")]
        string? practitionerId = null,
        CancellationToken cancellationToken = default)
    {
        var query = new List<string>();
        if (!string.IsNullOrWhiteSpace(date)) query.Add($"date={Uri.EscapeDataString(date)}");
        if (!string.IsNullOrWhiteSpace(practitionerId)) query.Add($"practitionerId={Uri.EscapeDataString(practitionerId)}");
        var qs = query.Count > 0 ? "?" + string.Join("&", query) : string.Empty;

        try
        {
            var response = await SchedulingClient.GetAsync(
                $"/api/v1/scheduling/slots{qs}", cancellationToken);

            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("SchedulingPlugin.GetAvailableSlots returned {Status}", (int)response.StatusCode);
                return $$"""{"error":"Scheduling service returned {{(int)response.StatusCode}}"}""";
            }

            return body;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "SchedulingPlugin.GetAvailableSlots failed");
            return """{"error":"Unable to retrieve available slots"}""";
        }
    }

    // ── Practitioners ──────────────────────────────────────────────────────────

    /// <summary>Find practitioners by specialty or list all active practitioners.</summary>
    [KernelFunction("search_practitioners")]
    [Description(
        "Searches for active practitioners (doctors, nurses, therapists) in the scheduling system. " +
        "Filter by medical specialty (e.g., 'Cardiology', 'Orthopedics', 'Primary Care'). " +
        "Returns each practitioner's ID, name, specialty, and availability window. " +
        "Use the returned practitioner ID with get_available_slots to find appointment times.")]
    public async Task<string> SearchPractitionersAsync(
        [Description("Medical specialty to filter by (e.g. 'Cardiology', 'Primary Care'). Leave empty to list all active practitioners.")]
        string? specialty = null,
        CancellationToken cancellationToken = default)
    {
        var qs = string.IsNullOrWhiteSpace(specialty)
            ? "?activeOnly=true"
            : $"?activeOnly=true&specialty={Uri.EscapeDataString(specialty)}";

        try
        {
            var response = await SchedulingClient.GetAsync(
                $"/api/v1/scheduling/practitioners{qs}", cancellationToken);

            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("SchedulingPlugin.SearchPractitioners returned {Status}", (int)response.StatusCode);
                return $$"""{"error":"Scheduling service returned {{(int)response.StatusCode}}"}""";
            }

            return body;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "SchedulingPlugin.SearchPractitioners failed");
            return """{"error":"Unable to search practitioners"}""";
        }
    }

    // ── Waitlist ───────────────────────────────────────────────────────────────

    /// <summary>Check the current waitlist status.</summary>
    [KernelFunction("get_waitlist")]
    [Description(
        "Returns entries on the appointment waitlist. " +
        "Waitlisted patients are waiting for a slot to open with their preferred practitioner or specialty. " +
        "Use this to understand scheduling backlog and prioritize urgent patients.")]
    public async Task<string> GetWaitlistAsync(
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await SchedulingClient.GetAsync(
                "/api/v1/scheduling/waitlist", cancellationToken);

            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("SchedulingPlugin.GetWaitlist returned {Status}", (int)response.StatusCode);
                return $$"""{"error":"Scheduling service returned {{(int)response.StatusCode}}"}""";
            }

            return body;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "SchedulingPlugin.GetWaitlist failed");
            return """{"error":"Unable to retrieve waitlist"}""";
        }
    }
}
