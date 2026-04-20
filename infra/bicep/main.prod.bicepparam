using 'main.bicep'

param envName = 'healthqcopilot-prod'
param location = 'eastus2'
param aadTenantId = '<TENANT_ID>'
param apimPublisherEmail = '<PUBLISHER_EMAIL>'
param logRetentionDays = 90
// Placeholder — configure-apim CI/CD job updates this to the Nginx ingress internal IP after AKS bootstrap
param aksIngressUrl = 'http://127.0.0.1'
