using HealthQCopilot.Infrastructure.Messaging;
using HealthQCopilot.Infrastructure.Middleware;
using HealthQCopilot.Infrastructure.Observability;
using HealthQCopilot.Ocr.Endpoints;
using HealthQCopilot.Ocr.Infrastructure;
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
