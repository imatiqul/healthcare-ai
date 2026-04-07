@description('Environment name prefix')
param envName string

@description('Azure region')
param location string

@description('Redis subnet resource ID')
param redisSubnetId string

resource redis 'Microsoft.Cache/redis@2024-03-01' = {
  name: '${envName}-redis'
  location: location
  properties: {
    sku: {
      name: 'Premium'
      family: 'P'
      capacity: 1
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
    }
    subnetId: redisSubnetId
  }
}

output redisId string = redis.id
output redisHostName string = redis.properties.hostName
