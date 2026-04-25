using System.ComponentModel;
using System.Net.Http.Json;
using Microsoft.SemanticKernel;

namespace HealthQCopilot.Agents.Plugins;

/// <summary>
/// Semantic Kernel plugin that wraps the FHIR service HTTP API so the AI agent
/// can look up patient demographics, encounter history, and appointments in
/// real time during a planning loop or triage session.
/// </summary>
public sealed class PatientPlugin(
    IHttpClientFactory httpClientFactory,
    ILogger<PatientPlugin> logger)
{
    private HttpClient FhirClient => httpClientFactory.CreateClient("fhir-service");

    // ── Patient demographics ───────────────────────────────────────────────────

    /// <summary>Fetch a patient record by its FHIR resource ID.</summary>
    [KernelFunction("get_patient")]
    [Description(
        "Retrieves a patient's demographic record from the FHIR server by their unique patient ID. " +
        "Returns the FHIR Patient resource as JSON, including name, date of birth, gender, " +
        "contact details, and identifiers (MRN, SSN masked).")]
    public async Task<string> GetPatientAsync(
        [Description("The FHIR Patient resource ID (UUID or MRN)")]
        string patientId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(patientId))
            return """{"error":"patientId is required"}""";

        try
        {
            var response = await FhirClient.GetAsync(
                $"/api/v1/fhir/patients/{Uri.EscapeDataString(patientId)}", cancellationToken);

            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("PatientPlugin.GetPatient returned {Status} for patient {Id}",
                    (int)response.StatusCode, patientId);
                return $$"""{"error":"FHIR service returned {{(int)response.StatusCode}}"}""";
            }

            return body;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "PatientPlugin.GetPatient failed for patient {Id}", patientId);
            return """{"error":"Unable to retrieve patient record"}""";
        }
    }

    /// <summary>Search patients by name or identifier.</summary>
    [KernelFunction("search_patients")]
    [Description(
        "Searches for patients by name (partial match) or medical record number (MRN). " +
        "Returns a FHIR Bundle of matching Patient resources. " +
        "Use this when you only have a name or identifier and need the patient's FHIR ID.")]
    public async Task<string> SearchPatientsAsync(
        [Description("Patient name to search (e.g. 'John Smith' or partial 'Smith')")]
        string? name = null,
        [Description("Patient identifier such as MRN or insurance ID")]
        string? identifier = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(name) && string.IsNullOrWhiteSpace(identifier))
            return """{"error":"Provide at least one of name or identifier"}""";

        var query = new List<string>();
        if (!string.IsNullOrWhiteSpace(name)) query.Add($"name={Uri.EscapeDataString(name)}");
        if (!string.IsNullOrWhiteSpace(identifier)) query.Add($"identifier={Uri.EscapeDataString(identifier)}");
        var qs = "?" + string.Join("&", query);

        try
        {
            var response = await FhirClient.GetAsync($"/api/v1/fhir/patients{qs}", cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("PatientPlugin.SearchPatients returned {Status}", (int)response.StatusCode);
                return $$"""{"error":"FHIR service returned {{(int)response.StatusCode}}"}""";
            }

            return body;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "PatientPlugin.SearchPatients failed");
            return """{"error":"Unable to search patients"}""";
        }
    }

    // ── Clinical history ───────────────────────────────────────────────────────

    /// <summary>Retrieve the encounter history for a patient.</summary>
    [KernelFunction("get_patient_encounters")]
    [Description(
        "Retrieves the clinical encounter history for a patient (ER visits, inpatient admissions, " +
        "outpatient visits, telehealth sessions). Returns a FHIR Bundle of Encounter resources " +
        "ordered by date. Use this to understand a patient's recent clinical activity.")]
    public async Task<string> GetPatientEncountersAsync(
        [Description("The FHIR Patient resource ID")]
        string patientId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(patientId))
            return """{"error":"patientId is required"}""";

        try
        {
            var response = await FhirClient.GetAsync(
                $"/api/v1/fhir/encounters/{Uri.EscapeDataString(patientId)}", cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("PatientPlugin.GetPatientEncounters returned {Status} for patient {Id}",
                    (int)response.StatusCode, patientId);
                return $$"""{"error":"FHIR service returned {{(int)response.StatusCode}}"}""";
            }

            return body;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "PatientPlugin.GetPatientEncounters failed for patient {Id}", patientId);
            return """{"error":"Unable to retrieve encounter history"}""";
        }
    }

    /// <summary>Retrieve upcoming and past appointments for a patient.</summary>
    [KernelFunction("get_patient_appointments")]
    [Description(
        "Retrieves scheduled appointments (past and upcoming) for a patient from the FHIR server. " +
        "Returns a FHIR Bundle of Appointment resources including status, practitioner, " +
        "location, and reason for visit.")]
    public async Task<string> GetPatientAppointmentsAsync(
        [Description("The FHIR Patient resource ID")]
        string patientId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(patientId))
            return """{"error":"patientId is required"}""";

        try
        {
            var response = await FhirClient.GetAsync(
                $"/api/v1/fhir/appointments/{Uri.EscapeDataString(patientId)}", cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("PatientPlugin.GetPatientAppointments returned {Status} for patient {Id}",
                    (int)response.StatusCode, patientId);
                return $$"""{"error":"FHIR service returned {{(int)response.StatusCode}}"}""";
            }

            return body;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "PatientPlugin.GetPatientAppointments failed for patient {Id}", patientId);
            return """{"error":"Unable to retrieve appointments"}""";
        }
    }
}
