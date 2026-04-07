using HealthcareAI.Infrastructure.Messaging;
using HealthcareAI.Infrastructure.Middleware;
using HealthcareAI.Infrastructure.Observability;
using HealthcareAI.Notifications.Endpoints;
using HealthcareAI.Notifications.Infrastructure;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddHealthcareObservability(builder.Configuration, "notification-service");
builder.Services.AddControllers().AddDapr();
builder.Services.AddDbContext<NotificationDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("NotificationDb")));
builder.Services.AddHostedService<OutboxRelayService<NotificationDbContext>>();
builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseMiddleware<PhiAuditMiddleware>();
app.MapControllers();
app.MapDefaultEndpoints();
app.MapNotificationEndpoints();

app.Run();
