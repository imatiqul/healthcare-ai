@description('Environment name prefix')
param envName string

@description('Azure region')
param location string

@description('APIM subnet resource ID')
param apimSubnetId string

@description('Publisher email for APIM')
param publisherEmail string

resource apim 'Microsoft.ApiManagement/service@2023-09-01-preview' = {
  name: '${envName}-apim'
  location: location
  sku: {
    name: 'Developer'
    capacity: 1
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    publisherName: 'HealthQ Copilot'
    publisherEmail: publisherEmail
    virtualNetworkType: 'Internal'
    virtualNetworkConfiguration: {
      subnetResourceId: apimSubnetId
    }
    customProperties: {
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls10': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls11': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Ssl30': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Ciphers.TripleDes168': 'false'
    }
  }
}

// Global rate-limit policy
resource globalPolicy 'Microsoft.ApiManagement/service/policies@2023-09-01-preview' = {
  parent: apim
  name: 'policy'
  properties: {
    value: '''
      <policies>
        <inbound>
          <rate-limit calls="100" renewal-period="60" />
          <set-header name="X-Correlation-Id" exists-action="skip">
            <value>@(context.RequestId)</value>
          </set-header>
          <validate-jwt header-name="Authorization" failed-validation-httpcode="401">
            <openid-config url="${environment().authentication.loginEndpoint}common/v2.0/.well-known/openid-configuration" />
            <required-claims>
              <claim name="aud" match="any">
                <value>api://healthq-copilot</value>
              </claim>
            </required-claims>
          </validate-jwt>
        </inbound>
        <backend>
          <forward-request />
        </backend>
        <outbound>
          <set-header name="X-Powered-By" exists-action="delete" />
          <set-header name="Server" exists-action="delete" />
        </outbound>
      </policies>
    '''
    format: 'xml'
  }
}

output gatewayUrl string = apim.properties.gatewayUrl
output apimId string = apim.id
output developerPortalUrl string = apim.properties.developerPortalUrl

// ---------------------------------------------------------------------------
// API Products — groups related APIs for access control and subscription plans
// ---------------------------------------------------------------------------

// Product: Clinical API (FHIR + Encounters + Triage)
resource clinicalProduct 'Microsoft.ApiManagement/service/products@2023-09-01-preview' = {
  parent: apim
  name: 'clinical-api'
  properties: {
    displayName: 'HealthQ Clinical API'
    description: 'FHIR R4, Encounters, Triage, Population Health and Clinical Coding APIs for EHR integration partners.'
    state: 'published'
    subscriptionRequired: true
    approvalRequired: true
    subscriptionsLimit: 10
    terms: 'Usage subject to HealthQ Copilot BAA and HIPAA data-processing agreement.'
  }
}

resource clinicalProductPolicy 'Microsoft.ApiManagement/service/products/policies@2023-09-01-preview' = {
  parent: clinicalProduct
  name: 'policy'
  properties: {
    format: 'xml'
    value: '''
      <policies>
        <inbound>
          <rate-limit-by-key calls="500" renewal-period="60" counter-key="@(context.Subscription.Id)" />
          <quota-by-key calls="50000" bandwidth="512" renewal-period="86400" counter-key="@(context.Subscription.Id)" />
        </inbound>
      </policies>
    '''
  }
}

// Product: Revenue Cycle API
resource revenueProduct 'Microsoft.ApiManagement/service/products@2023-09-01-preview' = {
  parent: apim
  name: 'revenue-api'
  properties: {
    displayName: 'HealthQ Revenue Cycle API'
    description: 'Prior Authorisation, Claims, Eligibility and Remittance APIs for RCM and payer integrations.'
    state: 'published'
    subscriptionRequired: true
    approvalRequired: true
    subscriptionsLimit: 5
    terms: 'Usage subject to HealthQ Copilot BAA and HIPAA data-processing agreement.'
  }
}

// Product: Patient Engagement API (public-facing)
resource engagementProduct 'Microsoft.ApiManagement/service/products@2023-09-01-preview' = {
  parent: apim
  name: 'engagement-api'
  properties: {
    displayName: 'HealthQ Patient Engagement API'
    description: 'Appointment scheduling, notifications, patient portal, and care gap APIs for patient-facing apps.'
    state: 'published'
    subscriptionRequired: true
    approvalRequired: false   // self-service for partners
    subscriptionsLimit: 50
  }
}

// Product: Sandbox (no approval, generous limits, non-PHI only)
resource sandboxProduct 'Microsoft.ApiManagement/service/products@2023-09-01-preview' = {
  parent: apim
  name: 'sandbox'
  properties: {
    displayName: 'HealthQ Sandbox'
    description: 'Free sandbox environment for developers. Synthetic data only — no PHI.'
    state: 'published'
    subscriptionRequired: true
    approvalRequired: false
    subscriptionsLimit: 200
  }
}

// ---------------------------------------------------------------------------
// Named values for portal customisation
// ---------------------------------------------------------------------------

resource portalBrandingNamedValue 'Microsoft.ApiManagement/service/namedValues@2023-09-01-preview' = {
  parent: apim
  name: 'portal-branding-title'
  properties: {
    displayName: 'portal-branding-title'
    value: 'HealthQ Copilot Developer Portal'
    secret: false
  }
}

