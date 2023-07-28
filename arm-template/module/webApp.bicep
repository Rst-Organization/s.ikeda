param logAnalyticsId string
param storageAccountDiagId string
param location string

// App Service Plan
param appServicePlanId string

// Web App
param webAppName string
param linuxFxVersion string
param appCommandLine string
param healthCheckPath string
param appSettings array
param subnetResourceId string = ''
param ipSecurityRestrictions array = []
param vnetRouteAllEnabled bool

resource webApp 'Microsoft.Web/sites@2020-12-01' = {
  name: webAppName
  location: location
  properties: {
    serverFarmId: appServicePlanId
    clientAffinityEnabled: false
    httpsOnly: true
    siteConfig: {
      appSettings: appSettings
      linuxFxVersion: linuxFxVersion
      appCommandLine: appCommandLine
      alwaysOn: true
      healthCheckPath: healthCheckPath
      minTlsVersion: '1.2'
      ipSecurityRestrictions: ipSecurityRestrictions
      ftpsState: 'Disabled'
      http20Enabled: true
      webSocketsEnabled: false
      vnetRouteAllEnabled: vnetRouteAllEnabled
    }
  }
}

resource webApp_networkConfig 'Microsoft.Web/sites/networkConfig@2020-10-01' = if (subnetResourceId != '') {
  parent: webApp
  name: 'virtualNetwork'
  properties: {
    subnetResourceId: subnetResourceId
  }
}

resource webApp_diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-${webAppName}'
  scope: webApp
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
        category: 'AppServiceAntivirusScanAuditLogs'
        enabled: true
      }
      {
        category: 'AppServiceHTTPLogs'
        enabled: true
      }
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
      }
      {
        category: 'AppServiceAppLogs'
        enabled: true
      }
      {
        category: 'AppServiceFileAuditLogs'
        enabled: true
      }
      {
        category: 'AppServiceAuditLogs'
        enabled: true
      }
      {
        category: 'AppServiceIPSecAuditLogs'
        enabled: true
      }
      {
        category: 'AppServicePlatformLogs'
        enabled: true
      }
    ]
  }
}

output id string = webApp.id
output defaultHostName string = webApp.properties.defaultHostName
