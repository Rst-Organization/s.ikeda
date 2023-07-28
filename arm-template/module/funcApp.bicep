param name string
param serverFarmId string
param linuxFxVersion string
param appSettings array
param connectionStrings array
param subnetResourceId string = ''
param logAnalyticsId string
param location string
param http20Enabled bool
param vnetRouteAllEnabled bool
param storageAccountDiagId string

resource funcApp 'Microsoft.Web/sites@2020-12-01' = {
  name: name
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: serverFarmId
    clientAffinityEnabled: false
    httpsOnly: true
    siteConfig: {
      appSettings: appSettings
      alwaysOn: true
      linuxFxVersion: linuxFxVersion
      ftpsState: 'Disabled'
      connectionStrings: connectionStrings
      minTlsVersion: '1.2'
      http20Enabled: http20Enabled
      vnetRouteAllEnabled: vnetRouteAllEnabled
    }
  }
}

resource funcApp_networkConfig 'Microsoft.Web/sites/networkConfig@2020-10-01' = if (subnetResourceId != '') {
  parent: funcApp
  name: 'virtualNetwork'
  properties: {
    subnetResourceId: subnetResourceId
  }
}

resource funcApp_diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-${name}'
  scope: funcApp
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
        category: 'FunctionAppLogs'
        enabled: true
      }
    ]
  }
}

output tenantId string = funcApp.identity.tenantId
output principalId string = funcApp.identity.principalId
