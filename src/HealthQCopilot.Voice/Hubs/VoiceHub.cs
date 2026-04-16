using HealthQCopilot.Voice.Services;
using Microsoft.AspNetCore.SignalR;

namespace HealthQCopilot.Voice.Hubs;

public class VoiceHub : Hub
{
    private readonly ITranscriptionService _transcription;
    private readonly ILogger<VoiceHub> _logger;

    public VoiceHub(ITranscriptionService transcription, ILogger<VoiceHub> logger)
    {
        _transcription = transcription;
        _logger = logger;
    }

    public async Task JoinSession(string sessionId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);
        _logger.LogInformation("Client {ConnectionId} joined session {SessionId}",
            Context.ConnectionId, sessionId);
    }

    public async Task LeaveSession(string sessionId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, sessionId);
        await _transcription.StopContinuousRecognitionAsync(Guid.Parse(sessionId));
    }

    public async Task StartTranscription(string sessionId)
    {
        var sid = Guid.Parse(sessionId);
        await _transcription.StartContinuousRecognitionAsync(sid, Context.ConnectionAborted);
        await Clients.Group(sessionId).SendAsync("TranscriptionStarted", sessionId);
    }

    public async Task SendAudio(string sessionId, byte[] audioData)
    {
        var sid = Guid.Parse(sessionId);
        var transcript = await _transcription.TranscribeAudioChunkAsync(
            sid, audioData, Context.ConnectionAborted);

        if (!string.IsNullOrEmpty(transcript))
        {
            await Clients.Group(sessionId).SendAsync("TranscriptReceived", new
            {
                SessionId = sessionId,
                Text = transcript,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    public async Task StopTranscription(string sessionId)
    {
        await _transcription.StopContinuousRecognitionAsync(Guid.Parse(sessionId));
        await Clients.Group(sessionId).SendAsync("TranscriptionStopped", sessionId);
    }
}
