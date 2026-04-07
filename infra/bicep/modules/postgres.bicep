@description('Environment name prefix')
param envName string

@description('Azure region')
param location string

@description('PostgreSQL subnet resource ID')
param pgSubnetId string

@description('Private DNS zone resource ID')
param privateDnsZoneId string

// One PostgreSQL Flexible Server per bounded context (database-per-service)
var databases = [
  { name: 'voice', skuName: 'Standard_D2ds_v5', tier: 'GeneralPurpose', storageGb: 64 }
  { name: 'agent', skuName: 'Standard_D4ds_v5', tier: 'GeneralPurpose', storageGb: 128 }
  { name: 'fhir', skuName: 'Standard_D4ds_v5', tier: 'GeneralPurpose', storageGb: 256 }
  { name: 'ocr', skuName: 'Standard_D2ds_v5', tier: 'GeneralPurpose', storageGb: 128 }
  { name: 'scheduling', skuName: 'Standard_D2ds_v5', tier: 'GeneralPurpose', storageGb: 64 }
  { name: 'notification', skuName: 'Standard_D2ds_v5', tier: 'GeneralPurpose', storageGb: 64 }
  { name: 'pophealth', skuName: 'Standard_D4ds_v5', tier: 'GeneralPurpose', storageGb: 256 }
  { name: 'identity', skuName: 'Standard_D2ds_v5', tier: 'GeneralPurpose', storageGb: 32 }
]

resource pgServers 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = [
  for db in databases: {
    name: '${envName}-pg-${db.name}'
    location: location
    sku: {
      name: db.skuName
      tier: db.tier
    }
    properties: {
      version: '16'
      storage: {
        storageSizeGB: db.storageGb
        autoGrow: 'Enabled'
      }
      network: {
        delegatedSubnetResourceId: pgSubnetId
        privateDnsZoneArmResourceId: privateDnsZoneId
      }
      highAvailability: {
        mode: 'ZoneRedundant'
      }
      backup: {
        backupRetentionDays: 35
        geoRedundantBackup: 'Enabled'
      }
      authConfig: {
        activeDirectoryAuth: 'Enabled'
        passwordAuth: 'Disabled'
      }
      dataEncryption: {
        type: 'SystemManaged'
      }
    }
  }
]

resource pgDatabases 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = [
  for (db, i) in databases: {
    parent: pgServers[i]
    name: '${db.name}_db'
    properties: {
      charset: 'UTF8'
      collation: 'en_US.utf8'
    }
  }
]

// Enable pgcrypto for PHI encryption at rest
resource pgExtensions 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2024-08-01' = [
  for (db, i) in databases: {
    parent: pgServers[i]
    name: 'azure.extensions'
    properties: {
      value: 'pgcrypto,pg_stat_statements'
      source: 'user-override'
    }
  }
]

output serverNames array = [for (db, i) in databases: pgServers[i].name]
