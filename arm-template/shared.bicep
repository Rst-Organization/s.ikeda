param appName string
param appPrefix string = '${appName}${substring(uniqueString(resourceGroup().id), 0, 4)}'
param location string = resourceGroup().location

param containerRegistrySku string

var logAnalyticsName = 'log-${appPrefix}'
var storageAccountDiagName = 'st${appPrefix}'
var containerRegistryName = take('cr${replace(appPrefix, '-', '')}', 50)
var keyVaultName = 'kv-${appPrefix}'
var tenantId = subscription().tenantId

// Storage Diag
resource storageAccountDiag 'Microsoft.Storage/storageAccounts@2021-06-01' = {
  name: storageAccountDiagName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
}

// Log Analytics
module logAnalyticsModule 'module/logAnalytics.bicep' = {
  name: 'logAnalyticsDeploy'
  params: {
    location: location
    name: logAnalyticsName
    retentionInDays: 90
    storageAccountDiagId: storageAccountDiag.id
  }
}

// ACR
module containerRegistryModule 'module/containerRegistry.bicep' = {
  name: 'containerRegistryDeploy'
  params: {
    name: containerRegistryName
    location: location
    sku: containerRegistrySku
    logAnalyticsId: logAnalyticsModule.outputs.id
    storageAccountDiagId: storageAccountDiag.id
  }
}

// KeyVault
module keyVaultModule 'module/keyVault.bicep' = {
  name: 'keyVaultDeploy'
  params: {
    location: location
    logAnalyticsId: logAnalyticsModule.outputs.id
    storageAccountDiagId: storageAccountDiag.id
    name: keyVaultName
    tenantId: tenantId
  }
}
