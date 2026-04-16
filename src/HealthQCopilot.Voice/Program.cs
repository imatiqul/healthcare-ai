using HealthQCopilot.Infrastructure.Messaging;
using HealthQCopilot.Infrastructure.Middleware;
using HealthQCopilot.Infrastructure.Observability;
using HealthQCopilot.Voice.Endpoints;
using HealthQCopilot.Voice.Hubs;
using HealthQCopilot.Voice.Infrastructure;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddHealthcareObservability(builder.Configuration, "voice-service");
builder.Services.AddControllers().AddDapr();
builder.Services.AddDbContext<VoiceDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("VoiceDb")));
builder.Services.AddHostedService<OutboxRelayService<VoiceDbContext>>();
builder.Services.AddHealthChecks();
builder.Services.AddSignalR();

var app = builder.Build();

app.UseMiddleware<PhiAuditMiddleware>();
app.MapControllers();
app.MapDefaultEndpoints();
app.MapHub<VoiceHub>("/hubs/voice");
app.MapVoiceEndpoints();

app.Run();
