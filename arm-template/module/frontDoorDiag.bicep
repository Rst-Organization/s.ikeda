param name string = 'diag-${frontDoorName}'
param frontDoorName string
param logAnalyticsId string
param storageAccountDiagId string

resource frontDoor 'Microsoft.Network/frontDoors@2020-05-01' existing = {
  name: frontDoorName
}

resource frontDoor_diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: name
  scope: frontDoor
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
