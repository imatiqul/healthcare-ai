using 'main.bicep'

param envName = 'healthqcopilot-dev'
param location = 'eastus2'
param aadTenantId = '<TENANT_ID>'
param apimPublisherEmail = '<PUBLISHER_EMAIL>'
param logRetentionDays = 30
param b2cCountryCode = 'US'
// Placeholder — configure-apim CI/CD job updates this to the Nginx ingress internal IP after AKS bootstrap
param aksIngressUrl = 'http://127.0.0.1'
