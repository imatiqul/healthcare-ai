@description('Environment name prefix')
param envName string

@description('Azure region')
param location string

@description('Retention period in days')
param retentionDays int = 90

resource workspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${envName}-law'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: retentionDays
  }
}

output workspaceId string = workspace.id
output workspaceName string = workspace.name
