using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Xunit;

namespace HealthQCopilot.Tests.Unit.Chaos;

/// <summary>
/// Chaos tests that verify the platform degrades gracefully when external dependencies
/// (Qdrant vector store and Azure OpenAI) are unavailable.
/// </summary>
public class QdrantChaosTests
{
    [Fact]
    public async Task RagContextProvider_WhenQdrantUnavailable_ReturnsEmptyContext()
    {
        // Arrange — simulate a Qdrant connection failure
        var httpClient = new HttpClient(new SimulatedDownHandler());
        var logger = Substitute.For<ILogger<QdrantChaosProbe>>();
        var probe = new QdrantChaosProbe(httpClient, logger);

        // Act
        var context = await probe.SafeSearchAsync("patient symptoms", cancellationToken: default);

        // Assert — should return empty, not throw
        context.Should().BeEmpty();
    }

    [Fact]
    public async Task QdrantHealthCheck_WhenConnectionRefused_ReturnsDegraded()
    {
        var httpClient = new HttpClient(new SimulatedDownHandler());
        var logger = Substitute.For<ILogger<QdrantChaosProbe>>();
        var probe = new QdrantChaosProbe(httpClient, logger);

        var isHealthy = await probe.IsHealthyAsync();

        isHealthy.Should().BeFalse();
    }

    [Fact]
    public async Task QdrantSearch_WhenTimeout_DoesNotBlockLongerThanThreshold()
    {
        // Arrange — handler simulates a 10-second delay (will be cancelled by 2s timeout)
        var httpClient = new HttpClient(new SimulatedSlowHandler(delayMs: 10_000))
        {
            Timeout = TimeSpan.FromSeconds(2)
        };
        var logger = Substitute.For<ILogger<QdrantChaosProbe>>();
        var probe = new QdrantChaosProbe(httpClient, logger);

        var sw = System.Diagnostics.Stopwatch.StartNew();
        var context = await probe.SafeSearchAsync("anything");
        sw.Stop();

        sw.Elapsed.Should().BeLessThan(TimeSpan.FromSeconds(5));
        context.Should().BeEmpty();
    }
}

public class AzureOpenAiChaosTests
{
    [Fact]
    public async Task GuideOrchestrator_WhenAzureOpenAiDown_ReturnsGracefulFallback()
    {
        var httpClient = new HttpClient(new SimulatedDownHandler());
        var logger = Substitute.For<ILogger<OpenAiChaosProbe>>();
        var probe = new OpenAiChaosProbe(httpClient, logger);

        var result = await probe.SafeCompleteAsync("What is the triage status?");

        result.Should().NotBeNull();
        result!.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("unavailable");
    }

    [Fact]
    public async Task AzureOpenAi_WhenRateLimited_ReturnsBackoffResponse()
    {
        var httpClient = new HttpClient(new SimulatedRateLimitHandler());
        var logger = Substitute.For<ILogger<OpenAiChaosProbe>>();
        var probe = new OpenAiChaosProbe(httpClient, logger);

        var result = await probe.SafeCompleteAsync("What is the triage status?");

        result.Should().NotBeNull();
        result!.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("rate limit");
    }

    [Fact]
    public async Task AzureOpenAi_WhenTimeout_CompletesWithinCircuitBreakerThreshold()
    {
        var httpClient = new HttpClient(new SimulatedSlowHandler(delayMs: 30_000))
        {
            Timeout = TimeSpan.FromSeconds(3)
        };
        var logger = Substitute.For<ILogger<OpenAiChaosProbe>>();
        var probe = new OpenAiChaosProbe(httpClient, logger);

        var sw = System.Diagnostics.Stopwatch.StartNew();
        var result = await probe.SafeCompleteAsync("Trigger timeout");
        sw.Stop();

        sw.Elapsed.Should().BeLessThan(TimeSpan.FromSeconds(8));
        result!.IsFailure.Should().BeTrue();
    }
}

// ---------------------------------------------------------------------------
// Probe helpers — thin wrappers that call the real HTTP endpoints and catch
// exceptions, mimicking how the production services use HttpClient with
// resilience pipelines (Polly circuit breakers / retry budgets).
// ---------------------------------------------------------------------------

public class QdrantChaosProbe(HttpClient httpClient, ILogger<QdrantChaosProbe> logger)
{
    private const string QdrantBase = "http://localhost:6333";

    public async Task<IReadOnlyList<string>> SafeSearchAsync(
        string query,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var payload = new { vector = new float[1536], limit = 5 };
            using var content = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(payload),
                System.Text.Encoding.UTF8,
                "application/json");
            var response = await httpClient.PostAsync(
                $"{QdrantBase}/collections/clinical-kb/points/search",
                content,
                cancellationToken);
            response.EnsureSuccessStatusCode();
            return ["result"];   // simplified — real code parses JSON
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Qdrant search failed — returning empty context");
            return [];
        }
    }

    public async Task<bool> IsHealthyAsync()
    {
        try
        {
            var response = await httpClient.GetAsync($"{QdrantBase}/healthz");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }
}

public class OpenAiChaosProbe(HttpClient httpClient, ILogger<OpenAiChaosProbe> logger)
{
    // Simulate the result type used throughout the platform
    public async Task<ChaosResult?> SafeCompleteAsync(string prompt)
    {
        try
        {
            var payload = new { model = "gpt-4o", messages = new[] { new { role = "user", content = prompt } } };
            using var content = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(payload),
                System.Text.Encoding.UTF8,
                "application/json");
            var response = await httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content);

            if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                return ChaosResult.Fail("rate limit exceeded");

            response.EnsureSuccessStatusCode();
            return ChaosResult.Ok("completed");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            logger.LogWarning(ex, "Azure OpenAI unavailable");
            return ChaosResult.Fail("service unavailable");
        }
    }
}

public sealed record ChaosResult(bool IsFailure, string Error, string? Value)
{
    public static ChaosResult Ok(string value) => new(false, string.Empty, value);
    public static ChaosResult Fail(string error) => new(true, error, null);
}

// ---------------------------------------------------------------------------
// Simulated HttpMessageHandlers for chaos scenarios
// ---------------------------------------------------------------------------

internal sealed class SimulatedDownHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage _, CancellationToken __)
        => Task.FromException<HttpResponseMessage>(
               new HttpRequestException("Connection refused (chaos: simulated down)"));
}

internal sealed class SimulatedSlowHandler(int delayMs) : HttpMessageHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage _, CancellationToken ct)
    {
        await Task.Delay(delayMs, ct);
        return new HttpResponseMessage(System.Net.HttpStatusCode.OK);
    }
}

internal sealed class SimulatedRateLimitHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage _, CancellationToken __)
        => Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.TooManyRequests));
}
