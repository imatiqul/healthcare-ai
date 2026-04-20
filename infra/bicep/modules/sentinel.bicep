// Azure Sentinel (Microsoft Sentinel) workspace for HealthQ Copilot SIEM.
// Streams PHI access audit events, break-glass accesses, and security alerts.
// Meets HIPAA § 164.312(b) audit controls and SOC 2 CC7.2 requirements.

@description('Environment name prefix')
param envName string

@description('Azure region')
param location string

@description('Retention in days for Sentinel workspace (2557 = 7 years for HIPAA)')
param retentionDays int = 2557

// ---------------------------------------------------------------------------
// Dedicated Log Analytics workspace for Sentinel
// (separate from app-insights workspace to meet SIEM isolation requirements)
// ---------------------------------------------------------------------------

resource sentinelWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${envName}-sentinel-ws'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: retentionDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    workspaceCapping: {
      dailyQuotaGb: 10   // cost guardrail — raise for production
    }
  }
}

// Enable Microsoft Sentinel on the workspace
resource sentinel 'Microsoft.OperationsManagement/solutions@2015-11-01-preview' = {
  name: 'SecurityInsights(${sentinelWorkspace.name})'
  location: location
  plan: {
    name: 'SecurityInsights(${sentinelWorkspace.name})'
    product: 'OMSGallery/SecurityInsights'
    publisher: 'Microsoft'
    promotionCode: ''
  }
  properties: {
    workspaceResourceId: sentinelWorkspace.id
  }
}

// ---------------------------------------------------------------------------
// Data Collection Rule — stream audit events from app services
// ---------------------------------------------------------------------------

resource auditDcr 'Microsoft.Insights/dataCollectionRules@2022-06-01' = {
  name: '${envName}-audit-dcr'
  location: location
  properties: {
    description: 'Streams HealthQ Copilot audit events to Sentinel workspace for HIPAA/SOC2'
    dataSources: {
      syslog: []
      performanceCounters: []
    }
    destinations: {
      logAnalytics: [
        {
          workspaceResourceId: sentinelWorkspace.id
          name: 'sentinel-dest'
        }
      ]
    }
    dataFlows: [
      {
        streams: ['Microsoft-CommonSecurityLog']
        destinations: ['sentinel-dest']
      }
    ]
  }
}

// ---------------------------------------------------------------------------
// Sentinel Alert Rules — HIPAA-aligned threat detection
// ---------------------------------------------------------------------------

// Alert: Break-glass access outside business hours
resource breakGlassAlert 'Microsoft.SecurityInsights/alertRules@2023-02-01-preview' = {
  name: guid('${envName}-break-glass-sentinel')
  kind: 'Scheduled'
  scope: sentinelWorkspace
  properties: {
    displayName: 'HealthQ — Break-Glass Access Outside Business Hours'
    description: 'Emergency PHI access granted outside 08:00–18:00 UTC may indicate compromised credentials or insider threat.'
    severity: 'High'
    enabled: true
    query: '''
      AppTraces
      | where Message contains "BreakGlass" and Message contains "GRANTED"
      | extend HourOfDay = datetime_part("hour", TimeGenerated)
      | where HourOfDay < 8 or HourOfDay > 18
      | project TimeGenerated, Message, AppRoleName
    '''
    queryFrequency: 'PT1H'
    queryPeriod: 'PT1H'
    triggerOperator: 'GreaterThan'
    triggerThreshold: 0
    suppressionEnabled: false
    suppressionDuration: 'PT1H'
    incidentConfiguration: {
      createIncident: true
      groupingConfiguration: {
        enabled: true
        reopenClosedIncident: false
        lookbackDuration: 'PT5H'
        matchingMethod: 'AllEntities'
        groupByEntities: []
        groupByAlertDetails: []
        groupByCustomDetails: []
      }
    }
  }
}

// Alert: Bulk PHI export (>100 patient records in 5 min)
resource bulkPhiExportAlert 'Microsoft.SecurityInsights/alertRules@2023-02-01-preview' = {
  name: guid('${envName}-bulk-phi-export-sentinel')
  kind: 'Scheduled'
  scope: sentinelWorkspace
  properties: {
    displayName: 'HealthQ — Bulk PHI Export Detected'
    description: 'More than 100 patient records accessed by a single user in 5 minutes — potential data exfiltration.'
    severity: 'High'
    enabled: true
    query: '''
      AzureDiagnostics
      | where ResourceType == "APIMANAGEMENT/SERVICE"
      | where requestUri_s contains "/fhir/Patient"
      | summarize PatientRequests = count() by callerIpAddress, bin(TimeGenerated, 5m)
      | where PatientRequests > 100
    '''
    queryFrequency: 'PT5M'
    queryPeriod: 'PT5M'
    triggerOperator: 'GreaterThan'
    triggerThreshold: 0
    suppressionEnabled: false
    suppressionDuration: 'PT1H'
    incidentConfiguration: {
      createIncident: true
      groupingConfiguration: {
        enabled: true
        reopenClosedIncident: false
        lookbackDuration: 'PT1H'
        matchingMethod: 'AllEntities'
        groupByEntities: []
        groupByAlertDetails: []
        groupByCustomDetails: []
      }
    }
  }
}

// Alert: Multiple failed auth attempts (brute force)
resource bruteForceAlert 'Microsoft.SecurityInsights/alertRules@2023-02-01-preview' = {
  name: guid('${envName}-brute-force-sentinel')
  kind: 'Scheduled'
  scope: sentinelWorkspace
  properties: {
    displayName: 'HealthQ — Potential Brute Force Authentication'
    description: 'More than 10 failed authentication attempts from a single IP in 10 minutes.'
    severity: 'Medium'
    enabled: true
    query: '''
      AppTraces
      | where Message contains "authentication" and Message contains "failed"
      | summarize FailedAttempts = count() by ClientIP = tostring(split(Message, "ip=")[1]), bin(TimeGenerated, 10m)
      | where FailedAttempts > 10
    '''
    queryFrequency: 'PT10M'
    queryPeriod: 'PT10M'
    triggerOperator: 'GreaterThan'
    triggerThreshold: 0
    suppressionEnabled: false
    suppressionDuration: 'PT1H'
    incidentConfiguration: {
      createIncident: true
      groupingConfiguration: {
        enabled: false
        reopenClosedIncident: false
        lookbackDuration: 'PT5H'
        matchingMethod: 'AllEntities'
        groupByEntities: []
        groupByAlertDetails: []
        groupByCustomDetails: []
      }
    }
  }
}

output sentinelWorkspaceId string = sentinelWorkspace.id
output sentinelWorkspaceName string = sentinelWorkspace.name
output auditDcrId string = auditDcr.id
