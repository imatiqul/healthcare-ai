namespace HealthQCopilot.ServiceDefaults.Features;

/// <summary>
/// Centralised feature flag names used across all HealthQ Copilot microservices.
/// Names are namespaced under "HealthQ:" and must match the keys in Azure App Configuration.
/// </summary>
public static class HealthQFeatures
{
    // AI / Agentic
    public const string AgenticPlanning = "HealthQ:AgenticPlanning";
    public const string WearableStreaming = "HealthQ:WearableStreaming";
    public const string LlmClinicalCoding = "HealthQ:LlmClinicalCoding";
    public const string EpisodicMemory = "HealthQ:EpisodicMemory";
    /// <summary>
    /// Gates RAG context retrieval from Qdrant during triage and clinical coding.
    /// Disable to fall back to rule-based reasoning without vector-store enrichment.
    /// </summary>
    public const string RagRetrieval = "HealthQ:RagRetrieval";
    /// <summary>
    /// Gates the hallucination-guard fact-check pass after every LLM response.
    /// Disable during load testing or when evaluating raw model output.
    /// </summary>
    public const string HallucinationGuard = "HealthQ:HallucinationGuard";
    /// <summary>
    /// Gates the three microservice API plugins (Patient, Clinical, Scheduling) that
    /// make live HTTP calls to downstream services during the agentic planning loop.
    /// Disable to restrict the agent to offline/rule-based plugins only.
    /// </summary>
    public const string MicroserviceApiPlugins = "HealthQ:MicroserviceApiPlugins";

    // Revenue Cycle
    public const string AutoPriorAuth = "HealthQ:AutoPriorAuth";
    public const string ShadowModeCoding = "HealthQ:ShadowModeCoding";

    // Patient Engagement
    public const string MfaEnforced = "HealthQ:MfaEnforced";
    public const string PatientRegistration = "HealthQ:PatientRegistration";

    // Platform
    public const string BreakGlassAlert = "HealthQ:BreakGlassAlert";
    public const string AuditExport = "HealthQ:AuditExport";
    public const string BillingMetering = "HealthQ:BillingMetering";
}
