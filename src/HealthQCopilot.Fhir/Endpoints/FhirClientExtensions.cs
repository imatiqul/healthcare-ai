namespace HealthQCopilot.Fhir.Endpoints;

public static class FhirClientExtensions
{
    public static IServiceCollection AddFhirHttpClient(this IServiceCollection services, IConfiguration config)
    {
        services.AddHttpClient("FhirServer", client =>
        {
            client.BaseAddress = new Uri(config["FhirServer:BaseUrl"] ?? "http://localhost:8090/fhir/");
            client.DefaultRequestHeaders.Accept.Add(
                new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/fhir+json"));
        });
        return services;
    }
}
