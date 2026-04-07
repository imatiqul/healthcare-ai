@description('AKS cluster name to install Dapr extension on')
param aksClusterName string

resource aksCluster 'Microsoft.ContainerService/managedClusters@2024-09-02-preview' existing = {
  name: aksClusterName
}

resource daprExtension 'Microsoft.KubernetesConfiguration/extensions@2023-05-01' = {
  name: 'dapr'
  scope: aksCluster
  properties: {
    extensionType: 'microsoft.dapr'
    autoUpgradeMinorVersion: true
    configurationSettings: {
      'global.ha.enabled': 'true'
      'dapr-operator.replicaCount': '2'
      'global.mtls.enabled': 'true'
      'global.logLevel': 'warn'
    }
  }
}
