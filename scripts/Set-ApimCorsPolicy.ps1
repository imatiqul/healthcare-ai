param(
    [string]$ResourceGroup = "healthq-copilot-rg",
    [string]$ApimName = "healthq-copilot-apim"
)

$subId = (az account show --query id -o tsv).Trim()
$token = (az account get-access-token --query accessToken -o tsv).Trim()
$policyXml = Get-Content "C:\ATIQ\sources\repos\healthcare-ai\infra\apim\policies\global-cors-policy.xml" -Raw -Encoding UTF8

$body = @{
    properties = @{
        format = "xml"
        value  = $policyXml
    }
} | ConvertTo-Json -Depth 5

$uri = "https://management.azure.com/subscriptions/$subId/resourceGroups/$ResourceGroup/providers/Microsoft.ApiManagement/service/$ApimName/policies/policy?api-version=2022-08-01"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

Write-Host "Applying global CORS policy to APIM..."
try {
    $resp = Invoke-RestMethod -Uri $uri -Method PUT -Headers $headers -Body $body
    Write-Host "SUCCESS: $($resp.name)"
} catch {
    Write-Host "ERROR: $_"
    Write-Host $_.Exception.Response.StatusCode
}
