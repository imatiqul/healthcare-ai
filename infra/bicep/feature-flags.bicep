// Azure App Configuration for feature flags
resource appConfig 'Microsoft.AppConfiguration/configurationStores@2022-05-01' = {
  name: 'my-appconfig-store'
  location: resourceGroup().location
  sku: {
    name: 'standard'
  }
}

resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: 'my-keyvault'
  location: resourceGroup().location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    accessPolicies: []
    enableSoftDelete: true
    enablePurgeProtection: true
  }
}

output appConfigName string = appConfig.name
output keyVaultName string = keyVault.name
