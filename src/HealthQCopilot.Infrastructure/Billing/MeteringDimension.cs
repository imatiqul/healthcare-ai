namespace HealthQCopilot.Infrastructure.Billing;

/// <summary>
/// Metered dimensions aligned with Azure Marketplace SaaS offer billing plan.
/// Each dimension ID must match the Azure Partner Center plan configuration.
/// </summary>
public static class MeteringDimension
{
    /// <summary>Number of AI completion tokens consumed (aggregated per hour).</summary>
    public const string AiCompletions = "ai-completions";

    /// <summary>Duration of voice transcription/synthesis in minutes.</summary>
    public const string VoiceMinutes = "voice-minutes";

    /// <summary>Number of FHIR read/write operations processed.</summary>
    public const string FhirOperations = "fhir-operations";

    /// <summary>Number of prior authorisation submissions to payers.</summary>
    public const string PriorAuthSubmissions = "prior-auth-submissions";

    /// <summary>Number of clinical coding AI requests (CPT/ICD mapping).</summary>
    public const string ClinicalCodingRequests = "clinical-coding";

    /// <summary>Number of wearable vital data ingestion events.</summary>
    public const string WearableEvents = "wearable-events";
}
