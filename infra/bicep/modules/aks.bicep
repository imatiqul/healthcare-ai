@description('Environment name prefix')
param envName string

@description('Azure region')
param location string

@description('Entra ID tenant ID')
param aadTenantId string

@description('AKS subnet resource ID')
param aksSubnetId string

@description('Log Analytics workspace resource ID')
param logAnalyticsWorkspaceId string

resource aks 'Microsoft.ContainerService/managedClusters@2024-09-02-preview' = {
  name: '${envName}-aks'
  location: location
  sku: {
    name: 'Base'
    tier: 'Standard'
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    dnsPrefix: envName
    agentPoolProfiles: [
      {
        name: 'system'
        count: 2
        vmSize: 'Standard_D2s_v5'
        mode: 'System'
        osDiskType: 'Ephemeral'
        osDiskSizeGB: 30
        osType: 'Linux'
        osSKU: 'AzureLinux'
        nodeTaints: ['CriticalAddonsOnly=true:NoSchedule']
        vnetSubnetID: aksSubnetId
      }
      {
        name: 'apipool'
        count: 3
        minCount: 2
        maxCount: 10
        vmSize: 'Standard_D4s_v5'
        mode: 'User'
        enableAutoScaling: true
        osDiskType: 'Ephemeral'
        osType: 'Linux'
        osSKU: 'AzureLinux'
        nodeLabels: {
          workload: 'api'
        }
        vnetSubnetID: aksSubnetId
      }
      {
        name: 'aipool'
        count: 2
        minCount: 1
        maxCount: 6
        vmSize: 'Standard_D8s_v5'
        mode: 'User'
        enableAutoScaling: true
        osDiskType: 'Ephemeral'
        osType: 'Linux'
        osSKU: 'AzureLinux'
        nodeTaints: ['workload=ai:NoSchedule']
        nodeLabels: {
          workload: 'ai'
        }
        vnetSubnetID: aksSubnetId
      }
      {
        name: 'batchpool'
        count: 1
        minCount: 0
        maxCount: 4
        vmSize: 'Standard_D4s_v5'
        mode: 'User'
        enableAutoScaling: true
        osDiskType: 'Ephemeral'
        osType: 'Linux'
        osSKU: 'AzureLinux'
        scaleSetEvictionPolicy: 'Delete'
        spotMaxPrice: -1
        nodeTaints: ['kubernetes.azure.com/scalesetpriority=spot:NoSchedule']
        nodeLabels: {
          workload: 'batch'
        }
        vnetSubnetID: aksSubnetId
      }
    ]
    networkProfile: {
      networkPlugin: 'azure'
      networkPolicy: 'azure'
      loadBalancerSku: 'standard'
      serviceCidr: '10.2.0.0/16'
      dnsServiceIP: '10.2.0.10'
    }
    addonProfiles: {
      azureKeyvaultSecretsProvider: {
        enabled: true
        config: {
          enableSecretRotation: 'true'
          rotationPollInterval: '2m'
        }
      }
      omsagent: {
        enabled: true
        config: {
          logAnalyticsWorkspaceResourceID: logAnalyticsWorkspaceId
        }
      }
    }
    aadProfile: {
      managed: true
      tenantID: aadTenantId
      enableAzureRBAC: true
    }
    oidcIssuerProfile: {
      enabled: true
    }
    autoUpgradeProfile: {
      upgradeChannel: 'stable'
    }
    securityProfile: {
      defender: {
        securityMonitoring: {
          enabled: true
        }
      }
      workloadIdentity: {
        enabled: true
      }
    }
  }
}

output clusterName string = aks.name
output clusterId string = aks.id
output oidcIssuerUrl string = aks.properties.oidcIssuerProfile.issuerURL
