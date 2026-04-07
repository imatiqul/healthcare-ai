using HealthcareAI.Infrastructure.Messaging;
using HealthcareAI.Infrastructure.Middleware;
using HealthcareAI.Infrastructure.Observability;
using HealthcareAI.PopulationHealth.Endpoints;
using HealthcareAI.PopulationHealth.Infrastructure;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddHealthcareObservability(builder.Configuration, "pophealth-service");
builder.Services.AddControllers().AddDapr();
builder.Services.AddDbContext<PopHealthDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("PopHealthDb")));
builder.Services.AddHostedService<OutboxRelayService<PopHealthDbContext>>();
builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseMiddleware<PhiAuditMiddleware>();
app.MapControllers();
app.MapDefaultEndpoints();
app.MapPopHealthEndpoints();

app.Run();
