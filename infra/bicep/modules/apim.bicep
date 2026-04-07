@description('Environment name prefix')
param envName string

@description('Azure region')
param location string

@description('APIM subnet resource ID')
param apimSubnetId string

@description('Publisher email for APIM')
param publisherEmail string

resource apim 'Microsoft.ApiManagement/service@2023-09-01-preview' = {
  name: '${envName}-apim'
  location: location
  sku: {
    name: 'Developer'
    capacity: 1
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    publisherName: 'Healthcare AI'
    publisherEmail: publisherEmail
    virtualNetworkType: 'Internal'
    virtualNetworkConfiguration: {
      subnetResourceId: apimSubnetId
    }
    customProperties: {
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls10': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls11': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Ssl30': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Ciphers.TripleDes168': 'false'
    }
  }
}

// Global rate-limit policy
resource globalPolicy 'Microsoft.ApiManagement/service/policies@2023-09-01-preview' = {
  parent: apim
  name: 'policy'
  properties: {
    value: '''
      <policies>
        <inbound>
          <rate-limit calls="100" renewal-period="60" />
          <set-header name="X-Correlation-Id" exists-action="skip">
            <value>@(context.RequestId)</value>
          </set-header>
          <validate-jwt header-name="Authorization" failed-validation-httpcode="401">
            <openid-config url="${environment().authentication.loginEndpoint}common/v2.0/.well-known/openid-configuration" />
            <required-claims>
              <claim name="aud" match="any">
                <value>api://healthcare-ai</value>
              </claim>
            </required-claims>
          </validate-jwt>
        </inbound>
        <backend>
          <forward-request />
        </backend>
        <outbound>
          <set-header name="X-Powered-By" exists-action="delete" />
          <set-header name="Server" exists-action="delete" />
        </outbound>
      </policies>
    '''
    format: 'xml'
  }
}

output gatewayUrl string = apim.properties.gatewayUrl
output apimId string = apim.id
