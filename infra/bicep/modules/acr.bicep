@description('Environment name prefix')
param envName string

@description('Azure region')
param location string

resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: replace('${envName}acr', '-', '')
  location: location
  sku: {
    name: 'Premium'
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Disabled'
    networkRuleBypassOptions: 'AzureServices'
    policies: {
      retentionPolicy: {
        status: 'enabled'
        days: 30
      }
      trustPolicy: {
        status: 'enabled'
        type: 'Notary'
      }
    }
  }
}

output loginServer string = acr.properties.loginServer
output acrId string = acr.id
