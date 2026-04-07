using HealthcareAI.Fhir.Endpoints;
using HealthcareAI.Fhir.Persistence;
using HealthcareAI.Infrastructure.Messaging;
using HealthcareAI.Infrastructure.Middleware;
using HealthcareAI.Infrastructure.Observability;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddHealthcareObservability(builder.Configuration, "fhir-service");
builder.Services.AddControllers().AddDapr();
builder.Services.AddDbContext<FhirDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("FhirDb")));
builder.Services.AddHostedService<OutboxRelayService<FhirDbContext>>();
builder.Services.AddFhirHttpClient(builder.Configuration);
builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseMiddleware<PhiAuditMiddleware>();
app.MapControllers();
app.MapDefaultEndpoints();
app.MapFhirEndpoints();

app.Run();
