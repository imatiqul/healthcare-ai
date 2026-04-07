@description('Environment name prefix')
param envName string

@description('Azure region')
param location string

resource serviceBus 'Microsoft.ServiceBus/namespaces@2024-01-01' = {
  name: '${envName}-sb'
  location: location
  sku: {
    name: 'Premium'
    tier: 'Premium'
    capacity: 1
  }
  properties: {
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Disabled'
    zoneRedundant: true
  }
}

// Domain event topics
var topics = [
  'voice-events'
  'agent-events'
  'fhir-events'
  'ocr-events'
  'scheduling-events'
  'notification-events'
  'pophealth-events'
]

resource sbTopics 'Microsoft.ServiceBus/namespaces/topics@2024-01-01' = [
  for topic in topics: {
    parent: serviceBus
    name: topic
    properties: {
      maxSizeInMegabytes: 1024
      defaultMessageTimeToLive: 'P7D'
      enablePartitioning: true
      requiresDuplicateDetection: true
      duplicateDetectionHistoryTimeWindow: 'PT10M'
    }
  }
]

// Subscriptions for event consumers
resource voiceToAgentSub 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2024-01-01' = {
  parent: sbTopics[0] // voice-events
  name: 'agent-service'
  properties: {
    maxDeliveryCount: 10
    deadLetteringOnMessageExpiration: true
    lockDuration: 'PT1M'
  }
}

resource agentToFhirSub 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2024-01-01' = {
  parent: sbTopics[1] // agent-events
  name: 'fhir-service'
  properties: {
    maxDeliveryCount: 10
    deadLetteringOnMessageExpiration: true
    lockDuration: 'PT1M'
  }
}

resource agentToNotificationSub 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2024-01-01' = {
  parent: sbTopics[1] // agent-events
  name: 'notification-service'
  properties: {
    maxDeliveryCount: 10
    deadLetteringOnMessageExpiration: true
    lockDuration: 'PT1M'
  }
}

resource pophealthToNotificationSub 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2024-01-01' = {
  parent: sbTopics[6] // pophealth-events
  name: 'notification-service'
  properties: {
    maxDeliveryCount: 10
    deadLetteringOnMessageExpiration: true
    lockDuration: 'PT1M'
  }
}

output namespaceId string = serviceBus.id
output namespaceName string = serviceBus.name
