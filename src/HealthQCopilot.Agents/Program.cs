using HealthQCopilot.Agents.Endpoints;
using HealthQCopilot.Agents.Infrastructure;
using HealthQCopilot.Agents.Plugins;
using HealthQCopilot.Agents.Services;
using HealthQCopilot.Infrastructure.Auth;
using HealthQCopilot.Infrastructure.Messaging;
using HealthQCopilot.Infrastructure.Middleware;
using HealthQCopilot.Infrastructure.Observability;
using Microsoft.EntityFrameworkCore;
using Microsoft.SemanticKernel;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddHealthcareObservability(builder.Configuration, "ai-agent-service");
builder.Services.AddHealthcareAuth(builder.Configuration);
builder.Services.AddHealthcareRateLimiting();
builder.Services.AddControllers().AddDapr();
builder.Services.AddDbContext<AgentDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("AgentDb")));
builder.Services.AddHostedService<OutboxRelayService<AgentDbContext>>();
builder.Services.AddHealthChecks();
builder.Services.AddDatabaseHealthCheck<AgentDbContext>("agent");

builder.Services.AddKernel();
builder.Services.AddScoped<TriageOrchestrator>();

// Register Semantic Kernel plugins
builder.Services.AddSingleton(sp =>
{
    var collection = new KernelPluginCollection();
    collection.AddFromType<TriagePlugin>("Triage");
    return collection;
});

var app = builder.Build();

app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<PhiAuditMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.UseHealthcareRateLimiting();
app.MapControllers();
app.MapDefaultEndpoints();
app.MapAgentEndpoints();

app.Run();

public partial class Program { }
