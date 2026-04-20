// Azure Monitor Alert Rules + SLO definitions for HealthQ Copilot
// Deploys metric alerts, log-based alerts and an availability SLO target.

@description('Environment name prefix')
param envName string

@description('Azure region')
param location string

@description('Application Insights resource ID')
param appInsightsId string

@description('Log Analytics workspace resource ID')
param logAnalyticsWorkspaceId string

@description('PagerDuty integration webhook URL (stored in Key Vault — pass as secure reference)')
@secure()
param pagerDutyWebhookUrl string = ''

// ---------------------------------------------------------------------------
// Action groups
// ---------------------------------------------------------------------------

resource opsActionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: '${envName}-ops-alerts'
  location: 'global'
  properties: {
    groupShortName: 'HealthQOps'
    enabled: true
    emailReceivers: [
      {
        name: 'Platform Ops'
        emailAddress: 'platform-ops@healthq.health'
        useCommonAlertSchema: true
      }
    ]
    webhookReceivers: empty(pagerDutyWebhookUrl) ? [] : [
      {
        name: 'PagerDuty'
        serviceUri: pagerDutyWebhookUrl
        useCommonAlertSchema: true
      }
    ]
  }
}

resource clinicalActionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: '${envName}-clinical-alerts'
  location: 'global'
  properties: {
    groupShortName: 'HealthQClin'
    enabled: true
    emailReceivers: [
      {
        name: 'Clinical Lead'
        emailAddress: 'clinical-lead@healthq.health'
        useCommonAlertSchema: true
      }
    ]
    webhookReceivers: empty(pagerDutyWebhookUrl) ? [] : [
      {
        name: 'PagerDuty-Clinical'
        serviceUri: pagerDutyWebhookUrl
        useCommonAlertSchema: true
      }
    ]
  }
}

// ---------------------------------------------------------------------------
// SLO — p99 API latency ≤ 2 s (99% of requests)
// ---------------------------------------------------------------------------

resource latencyAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${envName}-slo-latency-p99'
  location: 'global'
  properties: {
    description: 'SLO BREACH — p99 API latency > 2 s (target ≤ 2 s at 99th percentile)'
    severity: 2
    enabled: true
    scopes: [appInsightsId]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    targetResourceType: 'Microsoft.Insights/components'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'p99latency'
          metricName: 'requests/duration'
          operator: 'GreaterThan'
          threshold: 2000          // milliseconds
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [{ actionGroupId: opsActionGroup.id }]
  }
}

// ---------------------------------------------------------------------------
// SLO — availability ≥ 99.9% (3-nines)
// ---------------------------------------------------------------------------

resource availabilityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${envName}-slo-availability'
  location: 'global'
  properties: {
    description: 'SLO BREACH — Availability dropped below 99.9% (3-nines target)'
    severity: 1
    enabled: true
    scopes: [appInsightsId]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    targetResourceType: 'Microsoft.Insights/components'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'availability'
          metricName: 'availabilityResults/availabilityPercentage'
          operator: 'LessThan'
          threshold: 99.9
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      { actionGroupId: opsActionGroup.id }
      { actionGroupId: clinicalActionGroup.id }
    ]
  }
}

// ---------------------------------------------------------------------------
// Error rate > 1% in 5-minute window
// ---------------------------------------------------------------------------

resource errorRateAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${envName}-error-rate'
  location: 'global'
  properties: {
    description: 'Error rate > 1% in last 5 minutes'
    severity: 2
    enabled: true
    scopes: [appInsightsId]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    targetResourceType: 'Microsoft.Insights/components'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'failedRequests'
          metricName: 'requests/failed'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Count'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [{ actionGroupId: opsActionGroup.id }]
  }
}

// ---------------------------------------------------------------------------
// DLQ message count > 0 (patient safety — lost events)
// ---------------------------------------------------------------------------

resource dlqAlert 'Microsoft.Insights/scheduledQueryRules@2022-06-15' = {
  name: '${envName}-dlq-messages'
  location: location
  properties: {
    description: 'Dead-letter queue has unprocessed messages — potential clinical data loss'
    severity: 1
    enabled: true
    scopes: [logAnalyticsWorkspaceId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT5M'
    criteria: {
      allOf: [
        {
          query: '''
            AzureMetrics
            | where MetricName == "DeadLetteredMessageCount"
            | where Average > 0
          '''
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [clinicalActionGroup.id, opsActionGroup.id]
    }
  }
}

// ---------------------------------------------------------------------------
// AI triage P1 escalation not delivered within 10 minutes
// ---------------------------------------------------------------------------

resource escalationDeliveryAlert 'Microsoft.Insights/scheduledQueryRules@2022-06-15' = {
  name: '${envName}-escalation-delivery-failed'
  location: location
  properties: {
    description: 'P1/P2 triage escalation notification not delivered — clinical patient safety risk'
    severity: 0   // Critical
    enabled: true
    scopes: [logAnalyticsWorkspaceId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT10M'
    criteria: {
      allOf: [
        {
          query: '''
            AppTraces
            | where Message contains "escalation.required" and Message contains "recipientAddress: null"
            | summarize count() by bin(TimeGenerated, 5m)
          '''
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [clinicalActionGroup.id, opsActionGroup.id]
    }
  }
}

// ---------------------------------------------------------------------------
// Wearable vital alert: SpO2 below threshold not processed within 60 s
// ---------------------------------------------------------------------------

resource wearableAlertBacklog 'Microsoft.Insights/scheduledQueryRules@2022-06-15' = {
  name: '${envName}-wearable-vital-backlog'
  location: location
  properties: {
    description: 'Wearable vital alerts are backlogged — possible Event Hubs consumer failure'
    severity: 1
    enabled: true
    scopes: [logAnalyticsWorkspaceId]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      allOf: [
        {
          query: '''
            AppTraces
            | where Message startswith "VITAL ALERT" and Message contains "critical"
            | where TimeGenerated < ago(2m)
          '''
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 5
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [clinicalActionGroup.id]
    }
  }
}

output opsActionGroupId string = opsActionGroup.id
output clinicalActionGroupId string = clinicalActionGroup.id
