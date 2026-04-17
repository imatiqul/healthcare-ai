using System.ComponentModel;
using HealthQCopilot.Agents.Infrastructure;
using HealthQCopilot.Domain.Agents;
using Microsoft.EntityFrameworkCore;
using Microsoft.SemanticKernel;

namespace HealthQCopilot.Agents.Plugins;

public sealed class DemoPlugin
{
    private readonly IServiceProvider _sp;
    private readonly ILogger<DemoPlugin> _logger;

    public DemoPlugin(IServiceProvider sp, ILogger<DemoPlugin> logger)
    {
        _sp = sp;
        _logger = logger;
    }

    [KernelFunction("get_demo_step_narration")]
    [Description("Get a narration script for a specific demo step to guide the client through the platform feature.")]
    public string GetDemoStepNarration(
        [Description("The demo step: Welcome, VoiceIntake, AiTriage, Scheduling, RevenueCycle, or PopulationHealth")] string step)
    {
        return step.ToLowerInvariant() switch
        {
            "welcome" or "0" => """
                **Welcome to HealthQ Copilot!**

                This is a cloud-native healthcare AI platform built with microservices architecture.
                I'll walk you through each module — from patient intake all the way to population health monitoring.

                The platform features:
                - **AI-powered voice transcription** for clinical encounters
                - **Automated triage** with human-in-the-loop for critical cases
                - **Smart scheduling** with practitioner availability
                - **Revenue cycle automation** — ICD-10 coding and prior authorization
                - **Population health** risk monitoring and care gap tracking

                Let's begin the tour!
                """,
            "voiceintake" or "1" => """
                **Voice Intake Module** (/voice)

                This module captures clinical encounters using AI-powered speech recognition.
                - Real-time transcription via Azure Speech Services
                - Automatic session management with SignalR streaming
                - Transcripts are automatically forwarded to AI Triage

                Navigate to the Voice page to see it in action.
                """,
            "aitriage" or "2" => """
                **AI Triage Module** (/triage)

                The AI automatically classifies patient urgency:
                - **P1 (Immediate)** — Requires human approval before proceeding
                - **P2 (Urgent)** — Prioritized scheduling
                - **P3 (Standard)** — Normal workflow
                - **P4 (Non-Urgent)** — Routine follow-up

                The human-in-the-loop guardrail ensures P1 cases always get clinician review.
                """,
            "scheduling" or "3" => """
                **Scheduling Module** (/scheduling)

                Smart appointment scheduling with:
                - Practitioner availability calendar
                - Slot reservation and booking
                - Date-based filtering

                The demo has pre-loaded 54 appointment slots across 3 practitioners.
                """,
            "revenuecycle" or "4" => """
                **Revenue Cycle Module** (/revenue)

                Automated medical billing with:
                - **ICD-10 Coding Queue** — AI suggests diagnosis codes, clinicians review and approve
                - **Prior Authorization** — Submit, track, and manage insurance approvals
                - Claims workflow from coding through submission

                The demo includes 5 coding jobs and 4 prior authorizations in various states.
                """,
            "populationhealth" or "5" => """
                **Population Health Module** (/population-health)

                Population-level health monitoring:
                - **Risk Stratification** — Patients categorized as Critical, High, Moderate, or Low risk
                - **Care Gaps** — Track unmet clinical needs and closure rates
                - **Quality Metrics** — Population-wide health outcomes

                The demo has 7 patient risk profiles and 6 care gaps loaded.
                """,
            _ => "Let me guide you through this feature of the platform."
        };
    }

    [KernelFunction("get_demo_feedback_summary")]
    [Description("Get a summary of feedback collected during the current demo session.")]
    public async Task<string> GetDemoFeedbackSummaryAsync(
        [Description("The demo session ID")] string sessionId)
    {
        try
        {
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AgentDbContext>();
            var id = Guid.Parse(sessionId);

            var session = await db.DemoSessions
                .Include(s => s.StepFeedbacks)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (session is null) return "Demo session not found.";

            if (session.StepFeedbacks.Count == 0) return "No feedback collected yet.";

            var avgRating = session.StepFeedbacks.Average(f => f.Rating);
            var feedbackLines = session.StepFeedbacks
                .OrderBy(f => f.Step)
                .Select(f => $"- **{f.Step}**: {f.Rating}/5 ⭐ — Tags: {string.Join(", ", f.Tags)}{(f.Comment != null ? $" — \"{f.Comment}\"" : "")}");

            return $"""
                **Demo Feedback Summary**
                Average Rating: {avgRating:F1}/5
                Steps Reviewed: {session.StepFeedbacks.Count}/6

                {string.Join("\n", feedbackLines)}
                """;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get feedback summary");
            return "Unable to retrieve feedback summary.";
        }
    }
}
