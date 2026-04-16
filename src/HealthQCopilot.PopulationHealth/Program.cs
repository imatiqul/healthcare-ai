using HealthQCopilot.Infrastructure.Auth;
using HealthQCopilot.Infrastructure.Messaging;
using HealthQCopilot.Infrastructure.Middleware;
using HealthQCopilot.Infrastructure.Observability;
using HealthQCopilot.PopulationHealth.Endpoints;
using HealthQCopilot.PopulationHealth.Infrastructure;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddHealthcareObservability(builder.Configuration, "pophealth-service");
builder.Services.AddHealthcareAuth(builder.Configuration);
builder.Services.AddHealthcareRateLimiting();
builder.Services.AddControllers().AddDapr();
builder.Services.AddDbContext<PopHealthDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("PopHealthDb")));
builder.Services.AddHostedService<OutboxRelayService<PopHealthDbContext>>();
builder.Services.AddHealthChecks();
builder.Services.AddDatabaseHealthCheck<PopHealthDbContext>("pophealth");

var app = builder.Build();

app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<PhiAuditMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.UseHealthcareRateLimiting();
app.MapControllers();
app.MapDefaultEndpoints();
app.MapPopHealthEndpoints();

app.Run();
