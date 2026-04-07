using HealthcareAI.Identity.Endpoints;
using HealthcareAI.Identity.Persistence;
using HealthcareAI.Infrastructure.Messaging;
using HealthcareAI.Infrastructure.Middleware;
using HealthcareAI.Infrastructure.Observability;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddHealthcareObservability(builder.Configuration, "identity-service");
builder.Services.AddControllers().AddDapr();
builder.Services.AddDbContext<IdentityDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("IdentityDb")));
builder.Services.AddHostedService<OutboxRelayService<IdentityDbContext>>();
builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseMiddleware<PhiAuditMiddleware>();
app.MapControllers();
app.MapDefaultEndpoints();
app.MapIdentityEndpoints();

app.Run();
