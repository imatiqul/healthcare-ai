using HealthcareAI.Infrastructure.Messaging;
using HealthcareAI.Infrastructure.Middleware;
using HealthcareAI.Infrastructure.Observability;
using HealthcareAI.Scheduling.Endpoints;
using HealthcareAI.Scheduling.Infrastructure;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddHealthcareObservability(builder.Configuration, "scheduling-service");
builder.Services.AddControllers().AddDapr();
builder.Services.AddDbContext<SchedulingDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("SchedulingDb")));
builder.Services.AddHostedService<OutboxRelayService<SchedulingDbContext>>();
builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseMiddleware<PhiAuditMiddleware>();
app.MapControllers();
app.MapDefaultEndpoints();
app.MapSchedulingEndpoints();

app.Run();
