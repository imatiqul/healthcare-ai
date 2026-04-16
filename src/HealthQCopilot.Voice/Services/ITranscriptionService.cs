namespace HealthQCopilot.Voice.Services;

public interface ITranscriptionService
{
    Task<string> TranscribeAudioChunkAsync(Guid sessionId, byte[] audioData, CancellationToken ct);
    Task StartContinuousRecognitionAsync(Guid sessionId, CancellationToken ct);
    Task StopContinuousRecognitionAsync(Guid sessionId);
}
