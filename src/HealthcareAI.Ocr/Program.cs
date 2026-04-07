using HealthcareAI.Infrastructure.Messaging;
using HealthcareAI.Infrastructure.Middleware;
using HealthcareAI.Infrastructure.Observability;
using HealthcareAI.Ocr.Endpoints;
using HealthcareAI.Ocr.Infrastructure;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddHealthcareObservability(builder.Configuration, "ocr-service");
builder.Services.AddControllers().AddDapr();
builder.Services.AddDbContext<OcrDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("OcrDb")));
builder.Services.AddHostedService<OutboxRelayService<OcrDbContext>>();
builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseMiddleware<PhiAuditMiddleware>();
app.MapControllers();
app.MapDefaultEndpoints();
app.MapOcrEndpoints();

app.Run();
