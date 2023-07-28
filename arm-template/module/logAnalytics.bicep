param name string
param retentionInDays int = 30
param location string
param storageAccountDiagId string

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2020-08-01' = {
  name: name
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: retentionInDays
  }
}

resource logAnalytics_diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-${name}'
  scope: logAnalytics
  properties: {
    workspaceId: logAnalytics.id
    storageAccountId: empty(storageAccountDiagId) ? null : storageAccountDiagId
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
      }
    ]
  }
}

output id string = logAnalytics.id
