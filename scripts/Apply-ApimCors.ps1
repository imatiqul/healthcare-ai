$subId = (az account show --query id -o tsv).Trim()
$token = (az account get-access-token --query accessToken -o tsv).Trim()

$policyXml = @'
<policies><inbound><cors allow-credentials="false"><allowed-origins><origin>https://gentle-tree-03115af0f.7.azurestaticapps.net</origin><origin>http://localhost:3000</origin><origin>http://localhost:3001</origin><origin>http://localhost:3002</origin><origin>http://localhost:3003</origin><origin>http://localhost:3004</origin><origin>http://localhost:3005</origin></allowed-origins><allowed-methods preflight-result-max-age="600"><method>GET</method><method>POST</method><method>PUT</method><method>DELETE</method><method>OPTIONS</method></allowed-methods><allowed-headers><header>*</header></allowed-headers><expose-headers><header>*</header></expose-headers></cors></inbound><backend><forward-request /></backend><outbound><set-header name="X-Powered-By" exists-action="delete" /><set-header name="Server" exists-action="delete" /></outbound><on-error /></policies>
'@.Trim()

Write-Host "Policy XML length: $($policyXml.Length)"

$bodyObj = [ordered]@{
    properties = [ordered]@{
        format = "rawxml"
        value  = $policyXml
    }
}
$bodyJson = $bodyObj | ConvertTo-Json -Depth 5 -Compress
Write-Host "Body JSON length: $($bodyJson.Length)"

$uri = "https://management.azure.com/subscriptions/$subId/resourceGroups/healthq-copilot-rg/providers/Microsoft.ApiManagement/service/healthq-copilot-apim/policies/policy?api-version=2022-08-01"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json; charset=utf-8"
}

try {
    $resp = Invoke-RestMethod -Uri $uri -Method PUT -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($bodyJson))
    Write-Host "SUCCESS: policy '$($resp.name)' applied"
} catch {
    $errBody = $_.ErrorDetails.Message
    Write-Host "ERROR: $errBody"
}
