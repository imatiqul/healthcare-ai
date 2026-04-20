using System.Text.Json;
using System.Threading.RateLimiting;
using HealthQCopilot.Agents.Infrastructure;
using HealthQCopilot.Agents.Services;
using HealthQCopilot.Infrastructure.Metrics;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace HealthQCopilot.Agents.Endpoints;

public static class GuideEndpoints
{
    public static IEndpointRouteBuilder MapGuideEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/agents/guide")
            .WithTags("Platform Guide")
            .RequireRateLimiting("guide");

        group.MapPost("/chat", async (
            GuideChatRequest request,
            GuideOrchestrator orchestrator,
            CancellationToken ct) =>
        {
            var sessionId = request.SessionId ?? Guid.NewGuid();
            var response = await orchestrator.ChatAsync(sessionId, request.Message, ct);
            return Results.Ok(response);
        })
        .WithName("GuideChat")
        .WithSummary("Send a message to the HealthQ Copilot platform guide agent");

        group.MapGet("/suggestions", () =>
        {
            var suggestions = new[]
            {
                new GuideSuggestion("overview", "Show me the platform overview", "Learn what each module does"),
                new GuideSuggestion("workflow", "Guide me through the clinical workflow", "Step-by-step patient journey"),
                new GuideSuggestion("dashboard", "Show me the dashboard summary", "Real-time stats from all services"),
                new GuideSuggestion("triage", "What's the triage status?", "Pending cases and priorities"),
                new GuideSuggestion("scheduling", "Show available appointment slots", "Today's calendar overview"),
                new GuideSuggestion("revenue", "Show revenue cycle stats", "Coding queue and prior auth status"),
                new GuideSuggestion("pophealth", "Show high-risk patients", "Critical patients needing attention"),
                new GuideSuggestion("next", "What should I do next?", "Get guided to the next workflow step"),
            };
            return Results.Ok(suggestions);
        })
        .WithName("GuideSuggestions")
        .WithSummary("Get contextual suggestions for the platform guide");

        // ── SSE Streaming endpoint ───────────────────────────────────────────────
        // Streams the guide AI response token-by-token so the browser can render
        // tokens progressively without waiting for the full LLM completion.
        // The final SSE event is a JSON object: {"done":true,"suggestedRoute":"..."}.
        group.MapGet("/chat/stream", async (
            string message,
            Guid? sessionId,
            GuideOrchestrator orchestrator,
            BusinessMetrics metrics,
            HttpResponse httpResponse,
            CancellationToken ct) =>
        {
            httpResponse.Headers.ContentType = "text/event-stream; charset=utf-8";
            httpResponse.Headers.CacheControl = "no-cache";
            httpResponse.Headers.Connection = "keep-alive";

            metrics.GuideStreamingSessionsTotal.Add(1);

            var effectiveSessionId = sessionId ?? Guid.NewGuid();
            await foreach (var token in orchestrator.StreamChatAsync(effectiveSessionId, message, ct))
            {
                // Emit each item as an SSE data line.
                // Regular tokens: {"token":"..."}
                // Final sentinel:  {"done":true,"suggestedRoute":"..."}
                // The frontend discriminates by checking for the "done" key.
                string sseData;
                if (token.StartsWith("{\"done\":"))
                {
                    sseData = token; // already a JSON object (sentinel)
                }
                else
                {
                    metrics.GuideStreamingTokensTotal.Add(1);
                    sseData = JsonSerializer.Serialize(new { token });
                }
                await httpResponse.WriteAsync($"data: {sseData}\n\n", ct);
                await httpResponse.Body.FlushAsync(ct);
            }
        })
        .WithName("GuideChatStream")
        .WithSummary("Stream the HealthQ Copilot guide response via Server-Sent Events");

        // ── Conversation history endpoint ────────────────────────────────────────
        // Retrieves the stored conversation messages for a given session.
        group.MapGet("/history/{sessionId:guid}", async (
            Guid sessionId,
            AgentDbContext db,
            CancellationToken ct) =>
        {
            var conversation = await db.GuideConversations
                .AsNoTracking()
                .Include(c => c.Messages)
                .FirstOrDefaultAsync(c => c.Id == sessionId, ct);

            if (conversation is null)
                return Results.NotFound(new { error = "Conversation session not found." });

            var messages = conversation.Messages
                .OrderBy(m => m.Timestamp)
                .Select(m => new { m.Role, m.Content, m.Timestamp });

            return Results.Ok(new { sessionId, messages });
        })
        .WithName("GuideHistory")
        .WithSummary("Retrieve conversation history for a guide session");

        return app;
    }
}

public record GuideChatRequest(string Message, Guid? SessionId);
public record GuideSuggestion(string Id, string Text, string Description);
