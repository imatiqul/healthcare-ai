using HealthQCopilot.Infrastructure.Auth;
using HealthQCopilot.Infrastructure.Messaging;
using HealthQCopilot.Infrastructure.Middleware;
using HealthQCopilot.Infrastructure.Observability;
using HealthQCopilot.Voice.Endpoints;
using HealthQCopilot.Voice.Hubs;
using HealthQCopilot.Voice.Infrastructure;
using HealthQCopilot.Voice.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddHealthcareObservability(builder.Configuration, "voice-service");
builder.Services.AddHealthcareAuth(builder.Configuration);
builder.Services.AddHealthcareRateLimiting();
builder.Services.AddControllers().AddDapr();
builder.Services.AddDbContext<VoiceDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("VoiceDb")));
builder.Services.AddOutboxRelay<VoiceDbContext>(builder.Configuration);
builder.Services.AddSingleton<ITranscriptionService, AzureSpeechTranscriptionService>();
builder.Services.AddHealthChecks();
builder.Services.AddDatabaseHealthCheck<VoiceDbContext>("voice");
builder.Services.AddSignalR();

var app = builder.Build();

app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<PhiAuditMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.UseHealthcareRateLimiting();
app.MapControllers();
app.MapDefaultEndpoints();
app.MapHub<VoiceHub>("/hubs/voice");
app.MapVoiceEndpoints();

app.Run();

public partial class Program { }
