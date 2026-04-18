$endpoints = @(
    "https://healthq-copilot-apim.azure-api.net/api/v1/agents/stats",
    "https://healthq-copilot-apim.azure-api.net/api/v1/scheduling/stats",
    "https://healthq-copilot-apim.azure-api.net/api/v1/population-health/stats",
    "https://healthq-copilot-apim.azure-api.net/api/v1/revenue/stats"
)
foreach ($url in $endpoints) {
    $r = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 15
    $name = ($url -split '/')[-2..-1] -join '/'
    Write-Host "`n[$name] HTTP $($r.StatusCode)"
    Write-Host $r.Content
}
