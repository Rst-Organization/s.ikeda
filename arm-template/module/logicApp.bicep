param name string
param logAnalyticsId string
param storageAccountDiagId string
param location string

param workflowSchema string = 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#'
param definition string = '{"contentVersion":"1.0.0.0","parameters":{},"actions":{},"triggers":{},"outputs":{},"$schema":"${workflowSchema}"}'

resource logicApp 'Microsoft.Logic/workflows@2019-05-01' = {
  name: name
  location: location
  properties: {
    definition: json(definition)
    parameters: {}
    state: 'Enabled'
  }
}

resource logicApp_diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-${name}'
  scope: logicApp
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
