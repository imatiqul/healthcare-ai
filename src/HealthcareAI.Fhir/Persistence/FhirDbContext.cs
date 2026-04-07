using HealthcareAI.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HealthcareAI.Fhir.Persistence;

public class FhirDbContext(DbContextOptions<FhirDbContext> options) 
    : OutboxDbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
    }
}
