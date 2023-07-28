param name string
param tags object = {}
param logAnalyticsId string
param storageAccountDiagId string
param location string

resource applicationInsights 'microsoft.insights/components@2020-02-02-preview' = {
  name: name
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsId
  }
  tags: tags
}

resource applicationInsights_diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-${name}'
  scope: applicationInsights
  properties: {
    workspaceId: logAnalyticsId
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

output id string = applicationInsights.id
output ConnectionString string = applicationInsights.properties.ConnectionString
output InstrumentationKey string = applicationInsights.properties.InstrumentationKey
