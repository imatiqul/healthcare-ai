using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using System.Collections.Concurrent;

namespace HealthQCopilot.Voice.Services;

public sealed class AzureSpeechTranscriptionService : ITranscriptionService, IDisposable
{
    private readonly IConfiguration _config;
    private readonly ILogger<AzureSpeechTranscriptionService> _logger;
    private readonly ConcurrentDictionary<Guid, PushAudioInputStream> _streams = new();

    public AzureSpeechTranscriptionService(
        IConfiguration config,
        ILogger<AzureSpeechTranscriptionService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<string> TranscribeAudioChunkAsync(
        Guid sessionId, byte[] audioData, CancellationToken ct)
    {
        var speechKey = _config["AzureSpeech:Key"];
        var speechRegion = _config["AzureSpeech:Region"];

        if (string.IsNullOrEmpty(speechKey) || string.IsNullOrEmpty(speechRegion))
        {
            _logger.LogWarning("Azure Speech not configured; returning placeholder transcript");
            return $"[Transcript placeholder for {audioData.Length} bytes of audio]";
        }

        var speechConfig = SpeechConfig.FromSubscription(speechKey, speechRegion);
        speechConfig.SpeechRecognitionLanguage = "en-US";

        using var pushStream = AudioInputStream.CreatePushStream(
            AudioStreamFormat.GetWaveFormatPCM(16000, 16, 1));
        pushStream.Write(audioData);
        pushStream.Close();

        using var audioConfig = AudioConfig.FromStreamInput(pushStream);
        using var recognizer = new SpeechRecognizer(speechConfig, audioConfig);

        var result = await recognizer.RecognizeOnceAsync();

        return result.Reason switch
        {
            ResultReason.RecognizedSpeech => result.Text,
            ResultReason.NoMatch => string.Empty,
            _ => throw new InvalidOperationException(
                $"Speech recognition failed: {result.Reason}")
        };
    }

    public async Task StartContinuousRecognitionAsync(Guid sessionId, CancellationToken ct)
    {
        var pushStream = AudioInputStream.CreatePushStream(
            AudioStreamFormat.GetWaveFormatPCM(16000, 16, 1));
        _streams[sessionId] = pushStream;

        _logger.LogInformation("Started continuous recognition for session {SessionId}", sessionId);
        await Task.CompletedTask;
    }

    public async Task StopContinuousRecognitionAsync(Guid sessionId)
    {
        if (_streams.TryRemove(sessionId, out var stream))
        {
            stream.Close();
            stream.Dispose();
            _logger.LogInformation("Stopped continuous recognition for session {SessionId}", sessionId);
        }

        await Task.CompletedTask;
    }

    public void Dispose()
    {
        foreach (var kvp in _streams)
        {
            kvp.Value.Close();
            kvp.Value.Dispose();
        }
        _streams.Clear();
    }
}
