$r = Invoke-WebRequest 'https://healthq-copilot-apim.azure-api.net/api/v1/scheduling/stats' `
    -UseBasicParsing `
    -Headers @{ 'Origin' = 'https://gentle-tree-03115af0f.7.azurestaticapps.net' } `
    -TimeoutSec 20

Write-Host "HTTP: $($r.StatusCode)"
Write-Host "Body: $($r.Content)"
Write-Host "--- CORS Headers ---"
foreach ($key in $r.Headers.Keys) {
    if ($key -match 'cors|Access-Control') {
        Write-Host "${key}: $($r.Headers[$key])"
    }
}
Write-Host "--- All Headers ---"
foreach ($key in $r.Headers.Keys) {
    Write-Host "${key}: $($r.Headers[$key])"
}
