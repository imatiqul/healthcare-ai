FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/HealthcareAI.Domain/HealthcareAI.Domain.csproj", "src/HealthcareAI.Domain/"]
COPY ["src/HealthcareAI.Infrastructure/HealthcareAI.Infrastructure.csproj", "src/HealthcareAI.Infrastructure/"]
COPY ["src/HealthcareAI.Identity/HealthcareAI.Identity.csproj", "src/HealthcareAI.Identity/"]
RUN dotnet restore "src/HealthcareAI.Identity/HealthcareAI.Identity.csproj"
COPY . .
WORKDIR "/src/src/HealthcareAI.Identity"
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "HealthcareAI.Identity.dll"]
