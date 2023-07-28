@description('Specify the name of the Azure Redis Cache to create.')
param redisCacheName string

@description('Name of the storage account.')
param storageAccountName string

@description('The location of the Redis Cache. For best performance, use the same location as the app to be used with the cache.')
param location string

@description('Specify the pricing tier of the new Azure Redis Cache.')
@allowed([
  'Basic'
  'Standard'
  'Premium'
])
param redisCacheSKU string = 'Premium'

@description('Specify the family for the sku. C = Basic/Standard, P = Premium')
@allowed([
  'C'
  'P'
])
param redisCacheFamily string = 'P'

@description('Specify the size of the new Azure Redis Cache instance. Valid values: for C (Basic/Standard) family (0, 1, 2, 3, 4, 5, 6), for P (Premium) family (1, 2, 3, 4)')
@allowed([
  0
  1
  2
  3
  4
  5
  6
])
param redisCacheCapacity int = 1

@description('Specify a boolean value that indicates whether to allow access via non-SSL ports.')
param enableNonSslPort bool = false

@description('Specify a boolean value that indicates whether diagnostics should be saved to the specified storage account.')
param diagnosticsEnabled bool = true

param logAnalyticsId string
param storageAccountDiagId string
param redisCacheFirewallRules array

// データ永続化
param dataPersistence bool = false

param subnetId string
param staticIp string

var redisConfiguration = {
  'rdb-backup-enabled': 'true'
  'rdb-backup-frequency': '60'
  'rdb-backup-max-snapshot-count': '1'
  'rdb-storage-connection-string': storageAccountConnectionString
}

var storageAccountConnectionString = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${listKeys(storageAccount.id, storageAccount.apiVersion).keys[0].value};EndpointSuffix=${environment().suffixes.storage}'

resource storageAccount 'Microsoft.Storage/storageAccounts@2019-06-01' = if (dataPersistence) {
  name: storageAccountName
  location: location
  sku: {
    name: 'Premium_LRS'
  }
  properties: {}
  kind: 'Storage'
}

resource cache 'Microsoft.Cache/Redis@2020-12-01' = {
  name: redisCacheName
  location: location
  properties: {
    redisVersion: '6'
    enableNonSslPort: enableNonSslPort
    minimumTlsVersion: '1.2'
    sku: {
      capacity: redisCacheCapacity
      family: redisCacheFamily
      name: redisCacheSKU
    }
    redisConfiguration: dataPersistence ? (redisCacheSKU == 'Premium' ? redisConfiguration : null) : null
    publicNetworkAccess: 'Enabled'
    subnetId: empty(subnetId) ? null : subnetId
    staticIP: empty(staticIp) ? null : staticIp
  }
}

resource diagSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: cache
  name: redisCacheName
  properties: {
    workspaceId: logAnalyticsId
    storageAccountId: empty(storageAccountDiagId) ? null : storageAccountDiagId
    metrics: [
      {
        timeGrain: 'AllMetrics'
        enabled: diagnosticsEnabled
      }
    ]
    logs: [
      {
        category: 'ConnectedClientList'
        enabled: true
      }
    ]
  }
}

resource cache_firewallRule 'Microsoft.Cache/redis/firewallRules@2020-12-01' = [for item in redisCacheFirewallRules: {
  name: item.name
  parent: cache
  properties: {
    startIP: item.startIP
    endIP: item.endIP
  }
}]

output id string = cache.id
