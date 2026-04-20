// Azure Policy definitions and assignments for HealthQ Copilot data residency enforcement.
// Ensures all PHI-related resources are created only in allowed regions per tenant jurisdiction.

@description('Environment name prefix')
param envName string

@description('Primary allowed Azure region (e.g. eastus2 for US, uksouth for UK/NHS)')
param primaryRegion string = 'eastus2'

@description('Secondary allowed region for DR pairs (e.g. westus2 for US)')
param secondaryRegion string = 'westus2'

@description('Resource group to scope the assignment to')
param resourceGroupName string

@description('Subscription ID')
param subscriptionId string = subscription().subscriptionId

// ---------------------------------------------------------------------------
// Custom initiative: data residency
// ---------------------------------------------------------------------------

resource dataResidencyInitiative 'Microsoft.Authorization/policySetDefinitions@2023-04-01' = {
  name: '${envName}-data-residency'
  properties: {
    displayName: 'HealthQ Copilot — Data Residency Controls'
    description: 'Ensures all HealthQ Copilot resources are deployed only in approved regions per HIPAA/GDPR/NHS data residency requirements.'
    policyType: 'Custom'
    metadata: {
      category: 'HealthQ Compliance'
      version: '1.0.0'
    }
    parameters: {
      allowedLocations: {
        type: 'Array'
        defaultValue: [primaryRegion, secondaryRegion, 'global']
        metadata: {
          displayName: 'Allowed locations'
          description: 'The list of locations that can be specified when deploying resources.'
          strongType: 'location'
        }
      }
    }
    policyDefinitions: [
      {
        policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/e56962a6-4747-49cd-b67b-bf8b01975c4f'
        policyDefinitionReferenceId: 'AllowedLocations'
        parameters: {
          listOfAllowedLocations: {
            value: '[parameters(\'allowedLocations\')]'
          }
        }
      }
      {
        policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/e765b5de-1225-4ba3-bd56-1ac6695af988'
        policyDefinitionReferenceId: 'AllowedLocationsForResourceGroups'
        parameters: {
          listOfAllowedLocations: {
            value: '[parameters(\'allowedLocations\')]'
          }
        }
      }
    ]
  }
}

// ---------------------------------------------------------------------------
// Custom policy: deny storage without customer-managed key encryption
// ---------------------------------------------------------------------------

resource storageEncryptionPolicy 'Microsoft.Authorization/policyDefinitions@2023-04-01' = {
  name: '${envName}-require-cmk-storage'
  properties: {
    displayName: 'HealthQ — Require CMK encryption on Storage Accounts'
    description: 'All storage accounts containing PHI must use Customer-Managed Key encryption (BYOK).'
    policyType: 'Custom'
    mode: 'All'
    metadata: { category: 'HealthQ Compliance' }
    policyRule: {
      if: {
        allOf: [
          { field: 'type', equals: 'Microsoft.Storage/storageAccounts' }
          {
            field: 'Microsoft.Storage/storageAccounts/encryption.keySource'
            notEquals: 'Microsoft.Keyvault'
          }
        ]
      }
      then: { effect: 'deny' }
    }
  }
}

// ---------------------------------------------------------------------------
// Custom policy: require HTTPS-only for all App Services
// ---------------------------------------------------------------------------

resource httpsOnlyPolicy 'Microsoft.Authorization/policyDefinitions@2023-04-01' = {
  name: '${envName}-require-https-appservice'
  properties: {
    displayName: 'HealthQ — Require HTTPS-only App Services'
    policyType: 'Custom'
    mode: 'Indexed'
    metadata: { category: 'HealthQ Compliance' }
    policyRule: {
      if: {
        allOf: [
          { field: 'type', equals: 'Microsoft.Web/sites' }
          { field: 'Microsoft.Web/sites/httpsOnly', notEquals: 'true' }
        ]
      }
      then: { effect: 'deny' }
    }
  }
}

// ---------------------------------------------------------------------------
// Assignment: data residency initiative → resource group scope
// ---------------------------------------------------------------------------

resource dataResidencyAssignment 'Microsoft.Authorization/policyAssignments@2023-04-01' = {
  name: '${envName}-data-residency-assign'
  scope: resourceGroup()
  properties: {
    displayName: 'HealthQ Data Residency — ${primaryRegion}'
    description: 'Enforces resource creation in approved regions for HIPAA/GDPR compliance.'
    policyDefinitionId: dataResidencyInitiative.id
    enforcementMode: 'Default'
    parameters: {
      allowedLocations: {
        value: [primaryRegion, secondaryRegion, 'global']
      }
    }
    nonComplianceMessages: [
      {
        message: 'Resource location not permitted. HealthQ PHI must reside in approved regions only. See https://aka.ms/healthq-data-residency'
      }
    ]
  }
}

// ---------------------------------------------------------------------------
// Assignment: CMK storage encryption
// ---------------------------------------------------------------------------

resource cmkStorageAssignment 'Microsoft.Authorization/policyAssignments@2023-04-01' = {
  name: '${envName}-cmk-storage-assign'
  scope: resourceGroup()
  properties: {
    displayName: 'HealthQ — CMK Required on Storage'
    policyDefinitionId: storageEncryptionPolicy.id
    enforcementMode: 'Default'
    nonComplianceMessages: [
      { message: 'All HealthQ storage accounts must use Customer-Managed Key encryption.' }
    ]
  }
}

// ---------------------------------------------------------------------------
// Assignment: HTTPS-only App Services
// ---------------------------------------------------------------------------

resource httpsOnlyAssignment 'Microsoft.Authorization/policyAssignments@2023-04-01' = {
  name: '${envName}-https-appservice-assign'
  scope: resourceGroup()
  properties: {
    displayName: 'HealthQ — HTTPS-only App Services'
    policyDefinitionId: httpsOnlyPolicy.id
    enforcementMode: 'Default'
    nonComplianceMessages: [
      { message: 'All HealthQ App Services must use HTTPS-only mode.' }
    ]
  }
}

output dataResidencyInitiativeId string = dataResidencyInitiative.id
output dataResidencyAssignmentId string = dataResidencyAssignment.id
