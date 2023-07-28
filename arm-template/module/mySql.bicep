param name string
param logAnalyticsId string
param storageAccountDiagId string
param location string

@minLength(1)
@description('Database administrator login name')
param mySqlAdministratorLogin string
@secure()
@minLength(8)
@maxLength(128)
@description('Database administrator password')
param mySqlAdminPassword string

@allowed([
  'GP_Gen5_2'
  'GP_Gen5_4'
  'GP_Gen5_8'
  'GP_Gen5_16'
  'GP_Gen5_32'
  'GP_Gen5_64'
  'MO_Gen5_2'
  'MO_Gen5_4'
  'MO_Gen5_8'
  'MO_Gen5_16'
  'MO_Gen5_32'
  'B_Gen5_1'
  'B_Gen5_2'
])
@description('Azure database for MySQL sku name : ')
param mySqlSkuName string = 'GP_Gen5_2'

@minValue(5120)
param mySqlStorageMB int = 5120

@allowed([
  'Disabled'
  'Enabled'
])
param mySqlStorageAutogrow string

@allowed([
  'Disabled'
  'Enabled'
])
@description('Geo-Redundant Backup setting')
param mySqlGeoRedundantBackup string = 'Disabled'

param mySqlConfigs array = [
  {
    name: 'query_store_capture_mode'
    value: 'ALL'
  }
]

param mySqlFirewallRules array
param mySqlVirtualNetworkRules array

resource mySql 'Microsoft.DBforMySQL/servers@2017-12-01' = {
  name: name
  location: location
  sku: {
    name: mySqlSkuName
  }
  properties: {
    administratorLogin: mySqlAdministratorLogin
    administratorLoginPassword: mySqlAdminPassword
    createMode: 'Default'
    version: '5.7'
    sslEnforcement: 'Enabled'
    minimalTlsVersion: 'TLS1_2'
    storageProfile: {
      storageMB: mySqlStorageMB
      backupRetentionDays: 7
      geoRedundantBackup: mySqlGeoRedundantBackup
      storageAutogrow: mySqlStorageAutogrow
    }
    publicNetworkAccess: 'Enabled'
  }
}

resource mySql_diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-${name}'
  scope: mySql
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

resource mySql_configs 'Microsoft.DBforMySQL/servers/configurations@2017-12-01' = [for item in mySqlConfigs: {
  name: item.name
  parent: mySql
  properties: {
    value: item.value
  }
}]

resource mySql_firewallRules 'Microsoft.DBforMySQL/servers/firewallRules@2017-12-01' = [for item in mySqlFirewallRules: {
  name: item.name
  parent: mySql
  properties: {
    startIpAddress: item.startIpAddress
    endIpAddress: item.endIpAddress
  }
}]

resource mySql_virtualNetworkRules 'Microsoft.DBforMySQL/servers/virtualNetworkRules@2017-12-01' = [for item in mySqlVirtualNetworkRules: {
  name: 'vnetrule-${item.subnetName}'
  parent: mySql
  properties: {
    virtualNetworkSubnetId: resourceId('Microsoft.Network/virtualNetworks/subnets', item.virtualNetworkName, item.subnetName)
  }
}]

output id string = mySql.id
output fullyQualifiedDomainName string = mySql.properties.fullyQualifiedDomainName
