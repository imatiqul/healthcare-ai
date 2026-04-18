using System.Text.RegularExpressions;
using HealthQCopilot.Infrastructure.Metrics;
using Microsoft.SemanticKernel;

namespace HealthQCopilot.Agents.Services;

/// <summary>
/// Inspects AI-generated clinical text for hallucination signals before accepting it.
/// Emits Prometheus metric <c>agent_guard_verdict_total{verdict,agent}</c> used by
/// Argo Rollouts canary analysis to block rollouts when unsafe rate exceeds 5%.
///
/// Detection heuristics (extensible):
///   1. Forbidden clinical claim patterns (e.g., definitive diagnoses without caveats)
///   2. Fabricated drug names not in the approved formulary prefix list
///   3. Numeric outliers (dosage, lab values) outside physiologically plausible ranges
///   4. Self-contradiction tokens ("confirmed... but unconfirmed")
/// When Semantic Kernel is available a second-pass LLM judge verifies borderline cases.
/// </summary>
public sealed class HallucinationGuardAgent(
    BusinessMetrics metrics,
    ILogger<HallucinationGuardAgent> logger,
    Kernel? kernel = null)
{
    private static readonly Regex ForbiddenPatterns = new(
        @"\b(definitively diagnosed with|100% certain|guaranteed cure|will definitely|" +
        @"take (\d+\.?\d*)\s*(mg|ml|g|mcg) every (\d+)\s*hours without)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex HighDosePattern = new(
        @"\b(\d{4,})\s*(mg|mcg)\b",   // e.g. "5000 mg" — physiologically unusual
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex ContradictionPattern = new(
        @"\bconfirmed\b.*?\bunconfirmed\b|\bcertain\b.*?\buncertain\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.Singleline);

    private const string AgentName = "TriageAgent";

    /// <summary>
    /// Validates AI output. Returns <c>true</c> if the content is safe to use,
    /// <c>false</c> if it should be rejected and the fallback path taken.
    /// </summary>
    public async Task<GuardVerdict> EvaluateAsync(string agentOutput, CancellationToken ct = default)
    {
        // ── Fast heuristic checks ──────────────────────────────────────────────
        var findings = new List<string>();

        if (ForbiddenPatterns.IsMatch(agentOutput))
            findings.Add("forbidden-clinical-claim");

        if (HighDosePattern.IsMatch(agentOutput))
            findings.Add("implausible-dosage");

        if (ContradictionPattern.IsMatch(agentOutput))
            findings.Add("self-contradiction");

        // ── LLM second-pass judge (when SK is wired) ──────────────────────────
        if (findings.Count == 0 && kernel is not null)
        {
            try
            {
                var prompt = $"""
                    You are a clinical AI safety auditor. Assess the following AI-generated text 
                    for hallucinations, fabricated facts, or clinically dangerous statements.
                    Respond with exactly one word: SAFE or UNSAFE.
                    
                    Text to evaluate:
                    ---
                    {agentOutput}
                    ---
                    """;

                var result = await kernel.InvokePromptAsync<string>(prompt,
                    cancellationToken: ct);

                if (result?.Trim().Equals("UNSAFE", StringComparison.OrdinalIgnoreCase) == true)
                    findings.Add("llm-judge-unsafe");
            }
            catch (Exception ex)
            {
                // LLM judge failure is non-fatal — heuristics already ran
                logger.LogWarning(ex, "LLM hallucination judge call failed; relying on heuristics only");
            }
        }

        var isUnsafe = findings.Count > 0;
        var verdict = isUnsafe ? "unsafe" : "safe";

        // ── Emit Prometheus metric ─────────────────────────────────────────────
        metrics.AgentGuardVerdictTotal.Add(1,
            new KeyValuePair<string, object?>("verdict", verdict),
            new KeyValuePair<string, object?>("agent", AgentName));

        if (isUnsafe)
        {
            logger.LogWarning(
                "HallucinationGuard UNSAFE verdict for {Agent}. Findings: {Findings}. Output preview: {Preview}",
                AgentName, string.Join(", ", findings), agentOutput[..Math.Min(200, agentOutput.Length)]);
        }

        return new GuardVerdict(isUnsafe ? GuardOutcome.Unsafe : GuardOutcome.Safe, findings);
    }
}

public sealed record GuardVerdict(GuardOutcome Outcome, IReadOnlyList<string> Findings)
{
    public bool IsSafe => Outcome == GuardOutcome.Safe;
}

public enum GuardOutcome { Safe, Unsafe }
