param name string

@allowed([
  'Storage'
  'StorageV2'
])
param kind string

@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_RAGRS'
  'Standard_ZRS'
  'Premium_LRS'
  'Premium_ZRS'
  'Standard_GZRS'
  'Standard_RAGZRS'
])
param sku string
param properties object
param logAnalyticsId string
param storageAccountDiagId string
param location string
param isDiag bool

resource storageAccount 'Microsoft.Storage/storageAccounts@2019-06-01' = {
  name: name
  location: location
  sku: {
    name: sku
  }
  properties: properties
  kind: kind
}

resource storageAccount_diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-${name}'
  scope: storageAccount
  properties: {
    workspaceId: logAnalyticsId
    storageAccountId: empty(storageAccountDiagId) ? null : storageAccountDiagId
    metrics: [
      {
        category: 'Transaction'
        enabled: isDiag
      }
    ]
  }
}

resource storageAccount_blobService 'Microsoft.Storage/storageAccounts/blobServices@2021-02-01' = {
  name: 'default'
  parent: storageAccount
}

resource storageAccount_blobService_diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-blob-${name}'
  scope: storageAccount_blobService

  properties: {
    workspaceId: logAnalyticsId
    storageAccountId: empty(storageAccountDiagId) ? null : storageAccountDiagId
    logs: [
      {
        category: 'StorageRead'
        enabled: true
      }
      {
        category: 'StorageWrite'
        enabled: true
      }
      {
        category: 'StorageDelete'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'Transaction'
        enabled: isDiag
      }
    ]
  }
}

resource storageAccount_queueService 'Microsoft.Storage/storageAccounts/queueServices@2021-02-01' = if (kind == 'StorageV2') {
  name: 'default'
  parent: storageAccount
}

resource storageAccount_queueService_diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (kind == 'StorageV2') {
  name: 'diag-queue-${name}'
  scope: storageAccount_queueService
  properties: {
    workspaceId: logAnalyticsId
    storageAccountId: empty(storageAccountDiagId) ? null : storageAccountDiagId
    logs: [
      {
        category: 'StorageRead'
        enabled: true
      }
      {
        category: 'StorageWrite'
        enabled: true
      }
      {
        category: 'StorageDelete'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'Transaction'
        enabled: isDiag
      }
    ]
  }
}

resource storageAccount_tableService 'Microsoft.Storage/storageAccounts/tableServices@2021-02-01' = if (kind == 'StorageV2') {
  name: 'default'
  parent: storageAccount
}

resource storageAccount_tableService_diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (kind == 'StorageV2') {
  name: 'diag-table-${name}'
  scope: storageAccount_tableService
  properties: {
    workspaceId: logAnalyticsId
    storageAccountId: empty(storageAccountDiagId) ? null : storageAccountDiagId
    logs: [
      {
        category: 'StorageRead'
        enabled: true
      }
      {
        category: 'StorageWrite'
        enabled: true
      }
      {
        category: 'StorageDelete'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'Transaction'
        enabled: isDiag
      }
    ]
  }
}

resource storageAccount_fileService 'Microsoft.Storage/storageAccounts/fileServices@2021-02-01' = if (kind == 'StorageV2') {
  name: 'default'
  parent: storageAccount
}

resource storageAccount_fileService_diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (kind == 'StorageV2') {
  name: 'diag-file-${name}'
  scope: storageAccount_fileService
  properties: {
    workspaceId: logAnalyticsId
    storageAccountId: empty(storageAccountDiagId) ? null : storageAccountDiagId
    logs: [
      {
        category: 'StorageRead'
        enabled: true
      }
      {
        category: 'StorageWrite'
        enabled: true
      }
      {
        category: 'StorageDelete'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'Transaction'
        enabled: isDiag
      }
    ]
  }
}

output id string = storageAccount.id
output accountKey string = storageAccount.listKeys().keys[0].value
output ConnectionString string = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
output primaryEndpointBlob string = replace(replace(storageAccount.properties.primaryEndpoints.blob, 'https://', ''), '/', '')
output primaryEndpoints object = storageAccount.properties.primaryEndpoints
