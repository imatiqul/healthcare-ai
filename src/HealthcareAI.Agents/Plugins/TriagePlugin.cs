using System.ComponentModel;
using HealthcareAI.Domain.Agents;
using Microsoft.SemanticKernel;

namespace HealthcareAI.Agents.Plugins;

public sealed class TriagePlugin
{
    [KernelFunction("classify_urgency")]
    [Description("Classifies a medical transcript into a triage priority level with reasoning")]
    public TriageClassification ClassifyUrgency(
        [Description("The medical transcript text to analyze")] string transcriptText)
    {
        // Rule-based fallback classification when LLM is unavailable
        var lower = transcriptText.ToLowerInvariant();

        if (ContainsAny(lower, "chest pain", "difficulty breathing", "unresponsive", "cardiac arrest",
            "severe bleeding", "stroke", "anaphylaxis", "seizure"))
        {
            return new TriageClassification(TriageLevel.P1_Immediate,
                "Critical symptoms detected requiring immediate intervention.");
        }

        if (ContainsAny(lower, "fracture", "high fever", "severe pain", "head injury",
            "shortness of breath", "diabetic emergency", "laceration"))
        {
            return new TriageClassification(TriageLevel.P2_Urgent,
                "Urgent symptoms detected requiring prompt medical attention.");
        }

        if (ContainsAny(lower, "moderate pain", "infection", "swelling", "persistent cough",
            "vomiting", "dizziness", "rash with fever"))
        {
            return new TriageClassification(TriageLevel.P3_Standard,
                "Standard symptoms detected requiring timely care.");
        }

        return new TriageClassification(TriageLevel.P4_NonUrgent,
            "Non-urgent symptoms. Routine care recommended.");
    }

    private static bool ContainsAny(string text, params string[] keywords) =>
        keywords.Any(text.Contains);
}

public record TriageClassification(TriageLevel Level, string Reasoning);
