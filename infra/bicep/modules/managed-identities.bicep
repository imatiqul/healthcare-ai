@description('Environment name prefix')
param envName string

@description('Azure region')
param location string

@description('AKS OIDC issuer URL for workload identity federation')
param aksOidcIssuer string

@description('Key Vault resource ID for role assignments')
param keyVaultId string

@description('Service Bus namespace resource ID for role assignments')
param serviceBusNamespaceId string

// Service identities
var services = [
  { name: 'voice', sa: 'voice-service-sa' }
  { name: 'agent', sa: 'agent-service-sa' }
  { name: 'fhir', sa: 'fhir-service-sa' }
  { name: 'ocr', sa: 'ocr-service-sa' }
  { name: 'scheduling', sa: 'scheduling-service-sa' }
  { name: 'notification', sa: 'notification-service-sa' }
  { name: 'pophealth', sa: 'pophealth-service-sa' }
  { name: 'identity', sa: 'identity-service-sa' }
]

// Built-in role definition IDs
var keyVaultSecretsUserRole = '4633458b-17de-408a-b874-0445c86b69e6'
var serviceBusSenderRole = '69a216fc-b8fb-44d8-bc22-1f3c2cd27a39'
var serviceBusReceiverRole = '4f6d3b9b-027b-4f4c-9142-0e5a2a2247e0'

resource managedIdentities 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = [
  for svc in services: {
    name: '${envName}-${svc.name}-identity'
    location: location
  }
]

// Federated credentials for AKS workload identity
resource federatedCredentials 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = [
  for (svc, i) in services: {
    parent: managedIdentities[i]
    name: '${svc.name}-aks-federation'
    properties: {
      issuer: aksOidcIssuer
      subject: 'system:serviceaccount:healthcare:${svc.sa}'
      audiences: ['api://AzureADTokenExchange']
    }
  }
]

// Key Vault Secrets User role for all services
resource kvRoleAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [
  for (svc, i) in services: {
    name: guid(keyVaultId, managedIdentities[i].id, keyVaultSecretsUserRole)
    scope: resourceGroup()
    properties: {
      roleDefinitionId: subscriptionResourceId(
        'Microsoft.Authorization/roleDefinitions',
        keyVaultSecretsUserRole
      )
      principalId: managedIdentities[i].properties.principalId
      principalType: 'ServicePrincipal'
    }
  }
]

// Service Bus Sender role for all services
resource sbSenderRoles 'Microsoft.Authorization/roleAssignments@2022-04-01' = [
  for (svc, i) in services: {
    name: guid(serviceBusNamespaceId, managedIdentities[i].id, serviceBusSenderRole)
    scope: resourceGroup()
    properties: {
      roleDefinitionId: subscriptionResourceId(
        'Microsoft.Authorization/roleDefinitions',
        serviceBusSenderRole
      )
      principalId: managedIdentities[i].properties.principalId
      principalType: 'ServicePrincipal'
    }
  }
]

// Service Bus Receiver role for all services
resource sbReceiverRoles 'Microsoft.Authorization/roleAssignments@2022-04-01' = [
  for (svc, i) in services: {
    name: guid(serviceBusNamespaceId, managedIdentities[i].id, serviceBusReceiverRole)
    scope: resourceGroup()
    properties: {
      roleDefinitionId: subscriptionResourceId(
        'Microsoft.Authorization/roleDefinitions',
        serviceBusReceiverRole
      )
      principalId: managedIdentities[i].properties.principalId
      principalType: 'ServicePrincipal'
    }
  }
]

output identityIds array = [for (svc, i) in services: {
  name: svc.name
  clientId: managedIdentities[i].properties.clientId
  principalId: managedIdentities[i].properties.principalId
}]
