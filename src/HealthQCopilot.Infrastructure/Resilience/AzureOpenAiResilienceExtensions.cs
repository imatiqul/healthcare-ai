using System.Net;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http.Resilience;
using Polly;
using Polly.CircuitBreaker;
using Polly.Retry;
using Polly.Timeout;

namespace HealthQCopilot.Infrastructure.Resilience;

/// <summary>
/// Polly resilience pipeline tuned for Azure OpenAI HTTP clients.
///
/// Why a separate pipeline from the standard <see cref="ResilienceExtensions"/>?
///
/// Azure OpenAI enforces per-minute token (TPM) and request-per-minute (RPM) quotas.
/// When the quota is exhausted, Azure returns HTTP 429 with a <c>Retry-After</c> or
/// <c>Retry-After-Ms</c> header that gives the exact wait time. Generic exponential
/// backoff ignores this header and wastes retry budget.
///
/// Additionally, LLM calls are long-lived (streaming responses, multi-step reasoning).
/// The standard 5-second per-attempt timeout is too aggressive for a 5-step agentic
/// planning loop that may stream for 60+ seconds per call.
///
/// This pipeline:
///   1. Outer timeout:  5 minutes  — absolute wall clock for any single LLM call sequence
///   2. Inner timeout:  120 seconds — per-attempt, generous for streaming
///   3. Throttle retry: reads Retry-After-Ms / Retry-After header on 429 / 503
///   4. Circuit breaker: opens after 50% failures in 60 seconds (3 min break)
///      — prevents cascading load during Azure OpenAI regional outages
/// </summary>
public static class AzureOpenAiResilienceExtensions
{
    public static IHttpClientBuilder AddAzureOpenAiResilienceHandler(this IHttpClientBuilder builder)
    {
        builder.AddResilienceHandler("azure-openai-pipeline", pipeline =>
        {
            // ── 1. Outer wall-clock timeout ───────────────────────────────────
            pipeline.AddTimeout(new TimeoutStrategyOptions
            {
                Timeout = TimeSpan.FromMinutes(5)
            });

            // ── 2. Throttle-aware retry ───────────────────────────────────────
            pipeline.AddRetry(new HttpRetryStrategyOptions
            {
                MaxRetryAttempts = 4,
                Delay = TimeSpan.FromSeconds(2),
                BackoffType = DelayBackoffType.Exponential,
                UseJitter = true,

                // Retry on 429 (quota exceeded) and 503 (service unavailable / deployment busy)
                ShouldHandle = static args => ValueTask.FromResult(
                    args.Outcome.Result?.StatusCode is HttpStatusCode.TooManyRequests
                                                     or HttpStatusCode.ServiceUnavailable),

                // Respect Azure OpenAI Retry-After header for precise wait time
                DelayGenerator = static args =>
                {
                    var response = args.Outcome.Result;

                    // Prefer millisecond precision (Retry-After-Ms)
                    if (response?.Headers.TryGetValues("Retry-After-Ms", out var msValues) == true
                        && double.TryParse(msValues.FirstOrDefault(), out var retryMs)
                        && retryMs > 0)
                    {
                        return ValueTask.FromResult<TimeSpan?>(TimeSpan.FromMilliseconds(retryMs));
                    }

                    // Fall back to seconds (Retry-After)
                    if (response?.Headers.TryGetValues("Retry-After", out var secValues) == true
                        && double.TryParse(secValues.FirstOrDefault(), out var retrySec)
                        && retrySec > 0)
                    {
                        return ValueTask.FromResult<TimeSpan?>(TimeSpan.FromSeconds(retrySec));
                    }

                    // Header absent — use calculated exponential backoff (set by Polly)
                    return ValueTask.FromResult<TimeSpan?>(null);
                }
            });

            // ── 3. Circuit breaker ────────────────────────────────────────────
            // Opens after ≥50% failures with ≥3 requests in a 60-second window.
            // Stays open for 3 minutes — prevents hammering Azure OpenAI during outages.
            pipeline.AddCircuitBreaker(new HttpCircuitBreakerStrategyOptions
            {
                SamplingDuration = TimeSpan.FromSeconds(60),
                FailureRatio = 0.5,
                MinimumThroughput = 3,
                BreakDuration = TimeSpan.FromMinutes(3)
            });

            // ── 4. Per-attempt timeout ────────────────────────────────────────
            // Generous for streaming multi-step agentic loops.
            pipeline.AddTimeout(new TimeoutStrategyOptions
            {
                Timeout = TimeSpan.FromSeconds(120)
            });
        });

        return builder;
    }
}
