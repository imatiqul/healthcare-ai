using System.ComponentModel;
using System.Net.Http.Json;
using Microsoft.SemanticKernel;

namespace HealthQCopilot.Agents.Plugins;

/// <summary>
/// Semantic Kernel plugin that wraps the Population Health service HTTP API so
/// the AI agent can retrieve real patient risk scores, care gaps, and cohort
/// statistics when building clinical decision support recommendations.
/// </summary>
public sealed class ClinicalPlugin(
    IHttpClientFactory httpClientFactory,
    ILogger<ClinicalPlugin> logger)
{
    private HttpClient PopHealthClient => httpClientFactory.CreateClient("pophealth-service");

    // ── Risk scores ────────────────────────────────────────────────────────────

    /// <summary>Get the latest risk score for a specific patient.</summary>
    [KernelFunction("get_patient_risk_score")]
    [Description(
        "Retrieves the most recent population-health risk score for a patient. " +
        "Returns a risk record with level (Critical/High/Medium/Low), numeric risk score (0–100), " +
        "and assessment timestamp. Use this to understand a patient's overall risk profile " +
        "before making care recommendations.")]
    public async Task<string> GetPatientRiskScoreAsync(
        [Description("The patient GUID used across the population-health service")]
        string patientId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(patientId))
            return """{"error":"patientId is required"}""";

        if (!Guid.TryParse(patientId, out var patientGuid))
            return """{"error":"patientId must be a valid GUID"}""";

        try
        {
            var response = await PopHealthClient.GetAsync(
                $"/api/v1/population-health/risks/{patientGuid}", cancellationToken);

            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                return """{"riskLevel":"Unknown","message":"No risk assessment found for this patient"}""";

            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("ClinicalPlugin.GetPatientRiskScore returned {Status} for patient {Id}",
                    (int)response.StatusCode, patientId);
                return $$"""{"error":"Population-health service returned {{(int)response.StatusCode}}"}""";
            }

            return body;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "ClinicalPlugin.GetPatientRiskScore failed for patient {Id}", patientId);
            return """{"error":"Unable to retrieve risk score"}""";
        }
    }

    /// <summary>Get population-level high-risk patients.</summary>
    [KernelFunction("get_high_risk_patients")]
    [Description(
        "Returns a list of high-risk or critical-risk patients from the population-health registry. " +
        "Accepts optional riskLevel filter (Critical/High/Medium/Low) and a limit. " +
        "Use this for population-level care management queries, not for individual patient lookups.")]
    public async Task<string> GetHighRiskPatientsAsync(
        [Description("Risk level filter: Critical, High, Medium, or Low. Leave empty for all levels.")]
        string? riskLevel = null,
        [Description("Maximum number of patients to return (default 20, max 100)")]
        int top = 20,
        CancellationToken cancellationToken = default)
    {
        top = Math.Clamp(top, 1, 100);
        var qs = $"?top={top}";
        if (!string.IsNullOrWhiteSpace(riskLevel))
            qs += $"&riskLevel={Uri.EscapeDataString(riskLevel)}";

        try
        {
            var response = await PopHealthClient.GetAsync(
                $"/api/v1/population-health/risks{qs}", cancellationToken);

            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("ClinicalPlugin.GetHighRiskPatients returned {Status}", (int)response.StatusCode);
                return $$"""{"error":"Population-health service returned {{(int)response.StatusCode}}"}""";
            }

            return body;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "ClinicalPlugin.GetHighRiskPatients failed");
            return """{"error":"Unable to retrieve high-risk patients"}""";
        }
    }

    // ── Care gaps ──────────────────────────────────────────────────────────────

    /// <summary>Get open care gaps across the patient population.</summary>
    [KernelFunction("get_care_gaps")]
    [Description(
        "Retrieves open care gaps from the population-health service. " +
        "Care gaps represent preventive-care measures a patient is overdue for " +
        "(e.g., cancer screening, HbA1c testing, annual wellness visit). " +
        "Filter by status: Open, InProgress, Closed, or leave empty for all open gaps. " +
        "Use this to identify which patients need outreach or intervention.")]
    public async Task<string> GetCareGapsAsync(
        [Description("Care-gap status filter: Open, InProgress, or Closed. Leave empty to return all Open gaps.")]
        string? status = "Open",
        CancellationToken cancellationToken = default)
    {
        var qs = string.IsNullOrWhiteSpace(status) ? "" : $"?status={Uri.EscapeDataString(status)}";

        try
        {
            var response = await PopHealthClient.GetAsync(
                $"/api/v1/population-health/care-gaps{qs}", cancellationToken);

            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("ClinicalPlugin.GetCareGaps returned {Status}", (int)response.StatusCode);
                return $$"""{"error":"Population-health service returned {{(int)response.StatusCode}}"}""";
            }

            return body;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "ClinicalPlugin.GetCareGaps failed");
            return """{"error":"Unable to retrieve care gaps"}""";
        }
    }

    /// <summary>Get population-health summary statistics.</summary>
    [KernelFunction("get_population_health_summary")]
    [Description(
        "Returns aggregate population-health statistics including total enrolled patients, " +
        "risk distribution counts, and total open care gaps. " +
        "Use this to answer questions about the overall health status of the patient population.")]
    public async Task<string> GetPopulationHealthSummaryAsync(
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Fetch both risk distribution and care gap counts in parallel
            var risksTask = PopHealthClient.GetStringAsync("/api/v1/population-health/risks?top=1", cancellationToken);
            var gapsTask = PopHealthClient.GetStringAsync("/api/v1/population-health/care-gaps?status=Open", cancellationToken);

            await Task.WhenAll(risksTask, gapsTask);

            // Return a compact summary pointing to the detail endpoints
            return """{"message":"Use get_high_risk_patients and get_care_gaps for detailed data","risksEndpoint":"/api/v1/population-health/risks","careGapsEndpoint":"/api/v1/population-health/care-gaps"}""";
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "ClinicalPlugin.GetPopulationHealthSummary failed");
            return """{"error":"Unable to retrieve population-health summary"}""";
        }
    }
}
