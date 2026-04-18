$origin = 'https://gentle-tree-03115af0f.7.azurestaticapps.net'
$endpoints = @(
    "https://healthq-copilot-apim.azure-api.net/api/v1/agents/stats",
    "https://healthq-copilot-apim.azure-api.net/api/v1/scheduling/stats",
    "https://healthq-copilot-apim.azure-api.net/api/v1/population-health/stats",
    "https://healthq-copilot-apim.azure-api.net/api/v1/revenue/stats"
)
foreach ($url in $endpoints) {
    $r = Invoke-WebRequest $url -UseBasicParsing -Headers @{ Origin = $origin } -TimeoutSec 15
    $name = ($url -split '/')[-2..-1] -join '/'
    $acao = $r.Headers['Access-Control-Allow-Origin']
    Write-Host "`n[$name] HTTP $($r.StatusCode) | ACAO: $acao"
    Write-Host $r.Content
}
