@maxLength(11)
param appName string
param appPrefix string = '${appName}${substring(uniqueString(resourceGroup().id), 0, 4)}'
param location string = resourceGroup().location

param isAse bool = false

// CP Site
@minValue(28)
@maxValue(31)
param publicIPPrefixesNatGatewayCpPrefixLength int = 31
param appServiceCpSku string = 'P1v3'
param dockerRegistryCp object = {
  linuxFxVersion: 'DOCKER|mcr.microsoft.com/appsvc/staticsite:latest'
  url: 'https://mcr.microsoft.com'
  username: ''
  password: null
  startupCommand: ''
}

// Admin Site
param publicIPAddressNatGatewayAdminCount int = 1
param appServiceAdminSku string = 'P1v3'
param dockerRegistryAdmin object = {
  linuxFxVersion: 'DOCKER|mcr.microsoft.com/appsvc/staticsite:latest'
  url: 'https://mcr.microsoft.com'
  username: ''
  password: null
  startupCommand: ''
}

// MySQL
@minLength(1)
@description('Database administrator login name')
param mySqlCpLoginName string
@secure()
@minLength(8)
@maxLength(128)
@description('Database administrator password')
param mySqlCpLoginPassword string

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
param mySqlCpSkuName string = 'GP_Gen5_2'

@minValue(5120)
param mySqlCpStorageMB int = 5120

@allowed([
  'Disabled'
  'Enabled'
])
param mySqlCpStorageAutogrow string = 'Disabled'

@allowed([
  'Disabled'
  'Enabled'
])
@description('Geo-Redundant Backup setting')
param mySqlCpGeoRedundantBackup string = 'Disabled'

param mySqlCpConfigs array = [
  {
    name: 'query_store_capture_mode'
    value: 'ALL'
  }
]

@minLength(1)
@description('Database administrator login name')
param mySqlAdminLoginName string
@secure()
@minLength(8)
@maxLength(128)
@description('Database administrator password')
param mySqlAdminLoginPassword string

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
param mySqlAdminSkuName string = 'GP_Gen5_2'

@minValue(5120)
param mySqlAdminStorageMB int = 5120

@allowed([
  'Disabled'
  'Enabled'
])
param mySqlAdminStorageAutogrow string = 'Disabled'

@allowed([
  'Disabled'
  'Enabled'
])
@description('Geo-Redundant Backup setting')
param mySqlAdminGeoRedundantBackup string = 'Disabled'

param mySqlAdminConfigs array = [
  {
    name: 'query_store_capture_mode'
    value: 'ALL'
  }
]

param firewallRuleIpAddresses array

// DNS Zone
param dnsZoneName string

// Dashboard
param dashboardName string = 'dashboard-${appPrefix}'

// ActionGroup
param actionGroupsProperties array = []

// Redis
@allowed([
  'Basic'
  'Standard'
  'Premium'
])
param redisCacheSKU string = 'Premium'
@allowed([
  'C'
  'P'
])
param redisCacheFamily string = 'P'
@minValue(0)
@maxValue(6)
param redisCacheCapacity int = 1
param redisVnet bool

// WAF
param wafPolicyRuleAllowIpAddresses array

// Log Analytics
var logAnalyticsName = 'log-${appPrefix}'
var storageAccountDiagName = take('stdiag${replace(appPrefix, '-', '')}', 24)

// Application Insights
var applicationInsightsName = 'appi-${appPrefix}'

// VNET
var vnetName = 'vnet-${appPrefix}'
var subnetCpName = 'snet-cp'
var subnetBackName = 'snet-backend'
var subnetAdminName = 'snet-admin'
var subnetMaintenanceName = 'snet-maintenance'
var subnetRedisName = 'snet-redis'
var subnetAseName = 'snet-ase'

// ASE
var aseName = 'ase-${appPrefix}'

// Cp Site
var natGatewayCpName = 'ngw-cp-${appPrefix}'
var appServicePlanCpName = 'plan-cp-${appPrefix}'
var webAppCpName = 'app-cp-${appPrefix}'
var webAppCpDefaultHostName = isAse ? '${webAppCpName}.${aseName}.p.azurewebsites.net' : '${webAppCpName}.azurewebsites.net'

var frontDoorCpName = 'fd-cp-${appPrefix}'
var frontDoorEndpontCpName = '${frontDoorCpName}-azurefd-net'
var frontDoorBackendPoolCp = {
  name: 'backendPool-${webAppCpName}'
  healthProbeSettingName: 'healthProbeSetting-${webAppCpName}'
  loadBalancingSettingName: 'loadBalancingSetting-${webAppCpName}'
}
var frontDoorBackendPoolCpBlob = {
  name: 'backendPool-${storageAccountBlobName}'
  healthProbeSettingName: 'healthProbeSetting-${storageAccountBlobName}'
  loadBalancingSettingName: 'loadBalancingSetting-${storageAccountBlobName}'
}

// Admin Site
var natGatewayAdminName = 'ngw-admin-${appPrefix}'
var appServicePlanAdminName = 'plan-admin-${appPrefix}'
var webAppAdminName = 'app-admin-${appPrefix}'
var webAppAdminDefaultHostName = '${webAppAdminName}.azurewebsites.net'

var frontDoorAdminName = 'fd-admin-${appPrefix}'
var frontDoorEndpontAdminName = '${frontDoorAdminName}-azurefd-net'
var frontDoorBackendPoolAdmin = {
  name: 'backendPool-${webAppAdminName}'
  healthProbeSettingName: 'healthProbeSetting-${webAppAdminName}'
  loadBalancingSettingName: 'loadBalancingSetting-${webAppAdminName}'
}

var frontDoorDiags = [
  frontDoorCp.name
  frontDoorAdmin.name
]

var storageAccountFuncName = take('stfunc${replace(appPrefix, '-', '')}', 24)
var funcAppAdminBatchFailureName = 'func-admin-bf-${appPrefix}'
var logicAppAdminBatchFailureName = 'logic-admin-bf-${appPrefix}'

// MySQL
var mySqlCpName = 'mysql-cp-${appPrefix}'
var mySqlAdminName = 'mysql-admin-${appPrefix}'
var mySqlFirewallRules = [for item in firewallRuleIpAddresses: {
  name: item.name
  startIpAddress: item.ipAddress
  endIpAddress: item.ipAddress
}]
var mySqls = [
  {
    name: mySqlCpName
    mySqlAdministratorLogin: mySqlCpLoginName
    mySqlAdminPassword: mySqlCpLoginPassword
    mySqlSkuName: mySqlCpSkuName
    mySqlStorageMB: mySqlCpStorageMB
    mySqlGeoRedundantBackup: mySqlCpGeoRedundantBackup
    mySqlConfigs: mySqlCpConfigs
    mySqlFirewallRules: mySqlFirewallRules
    mySqlStorageAutogrow: mySqlCpStorageAutogrow
  }
  {
    name: mySqlAdminName
    mySqlAdministratorLogin: mySqlAdminLoginName
    mySqlAdminPassword: mySqlAdminLoginPassword
    mySqlSkuName: mySqlAdminSkuName
    mySqlStorageMB: mySqlAdminStorageMB
    mySqlGeoRedundantBackup: mySqlAdminGeoRedundantBackup
    mySqlConfigs: mySqlAdminConfigs
    mySqlFirewallRules: mySqlFirewallRules
    mySqlStorageAutogrow: mySqlAdminStorageAutogrow
  }
]

// CosmosDB
var cosmosDbAccountName = 'cosmos-${appPrefix}'
var cosmosDbAccountIpRulesAzurePortal = [
  {
    ipAddressOrRange: '104.42.195.92' // Azure Portal https://docs.microsoft.com/ja-jp/azure/cosmos-db/how-to-configure-firewall#allow-requests-from-the-azure-portal
  }
  {
    ipAddressOrRange: '40.76.54.131' // Azure Portal
  }
  {
    ipAddressOrRange: '52.176.6.30' // Azure Portal
  }
  {
    ipAddressOrRange: '52.169.50.45' // Azure Portal
  }
  {
    ipAddressOrRange: '52.187.184.26' // Azure Portal
  }
]
var cosmosDbAccountIpRulesClient = [for item in firewallRuleIpAddresses: {
  ipAddressOrRange: item.ipAddress
}]
var cosmosDbAccountIpRules = concat(cosmosDbAccountIpRulesAzurePortal, cosmosDbAccountIpRulesClient)

// Redis
var redisCacheName = 'redis-${appPrefix}'
var storageAccountRedisCacheName = take('stredis${replace(appPrefix, '-', '')}', 24)
var privateEndpointRedisCacheName = 'pep-${redisCacheName}'

// WAF
var wafPolicyName = 'waf${replace(appPrefix, '-', '')}'

// Storage
var storageAccountBlobName = take('stblob${replace(appPrefix, '-', '')}', 24)
var storageAccountEntrylogsName = take('stenlog${replace(appPrefix, '-', '')}', 24)

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

// Application Insights
module applicationInsights 'module/applicationInsights.bicep' = {
  name: 'applicationInsightsDeploy'
  params: {
    location: location
    logAnalyticsId: logAnalyticsModule.outputs.id
    storageAccountDiagId: storageAccountDiag.id
    name: applicationInsightsName
    tags: {}
  }
}

// ASE
resource appServiceEnvironment 'Microsoft.Web/hostingEnvironments@2021-02-01' = if (isAse) {
  name: aseName
  location: location
  kind: 'ASEV3'
  properties: {
    virtualNetwork: {
      id: resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, subnetAseName)
    }
    internalLoadBalancingMode: 'None'
    dedicatedHostCount: 0
    zoneRedundant: false
  }
}

resource appServiceEnvironment_diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (isAse) {
  name: 'diag-${aseName}'
  scope: appServiceEnvironment
  properties: {
    workspaceId: logAnalyticsModule.outputs.id
    storageAccountId: empty(storageAccountDiag) ? null : storageAccountDiag.id
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
    logs: [
      {
        category: 'AppServiceEnvironmentPlatformLogs'
        enabled: true
      }
    ]
  }
}

// Cp Site
module natGatewayCpModules 'module/natGateway.bicep' = {
  name: 'natGatewayCpDeploy'
  params: {
    natGatewayName: natGatewayCpName
    location: location
    sku: 'Standard'
    logAnalyticsId: logAnalyticsModule.outputs.id
    storageAccountDiagId: storageAccountDiag.id
    publicIPAddressCount: 0
    publicIPPrefixesCount: 1
    publicIPPrefixesLength: publicIPPrefixesNatGatewayCpPrefixLength
  }
}

module appServicePlanCpModule 'module/appServicePlan.bicep' = {
  name: 'appServicePlanCpDeploy'
  params: {
    appServicePlanName: appServicePlanCpName
    autoscaleEnabled: false
    location: location
    logAnalyticsId: logAnalyticsModule.outputs.id
    storageAccountDiagId: storageAccountDiag.id
    sku: appServiceCpSku
    aseId: isAse ? appServiceEnvironment.id : ''
  }
}

module webAppCpModule 'module/webApp.bicep' = {
  name: 'webAppCpDeploy'
  params: {
    appServicePlanId: appServicePlanCpModule.outputs.id
    appSettings: [
      {
        name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
        value: 'false'
      }
      {
        name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
        value: applicationInsights.outputs.ConnectionString
      }
      {
        name: 'DOCKER_REGISTRY_SERVER_URL'
        value: dockerRegistryCp.url
      }
      {
        name: 'DOCKER_REGISTRY_SERVER_USERNAME'
        value: dockerRegistryCp.username
      }
      {
        name: 'DOCKER_REGISTRY_SERVER_PASSWORD'
        value: dockerRegistryCp.password
      }
    ]
    healthCheckPath: '/health_check.html'
    linuxFxVersion: dockerRegistryCp.linuxFxVersion
    appCommandLine: dockerRegistryCp.startupCommand
    location: location
    logAnalyticsId: logAnalyticsModule.outputs.id
    storageAccountDiagId: storageAccountDiag.id
    webAppName: webAppCpName
    subnetResourceId: isAse ? '' : resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, subnetCpName)
    ipSecurityRestrictions: [
      {
        ipAddress: 'AzureFrontDoor.Backend'
        action: 'Allow'
        tag: 'ServiceTag'
        priority: 100
        name: frontDoorCpName
        headers: {
          'X-Azure-FDID': [
            reference(frontDoorCp.id, '2020-05-01').frontdoorId
          ]
        }
      }
    ]
    vnetRouteAllEnabled: isAse ? false : true
  }
}

resource webAppCp_slotconfignames 'Microsoft.Web/sites/config@2021-02-01' = {
  name: '${webAppCpName}/slotconfignames'
  properties: {
    appSettingNames: [
      'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
      'APPLICATIONINSIGHTS_CONNECTION_STRING'
    ]
  }
  dependsOn: [
    webAppCpModule
  ]
}

resource webAppCpSwapSlot 'Microsoft.Web/sites/slots@2021-02-01' = {
  name: '${webAppCpName}/swap'
  location: location
  properties: {
    serverFarmId: appServicePlanCpModule.outputs.id
    httpsOnly: true
  }
  dependsOn: [
    webAppCp_slotconfignames
  ]
}

// Admin Site
module natGatewayAdminModule 'module/natGateway.bicep' = {
  name: 'natGatewayAdminDeploy'
  params: {
    natGatewayName: natGatewayAdminName
    location: location
    sku: 'Standard'
    logAnalyticsId: logAnalyticsModule.outputs.id
    storageAccountDiagId: storageAccountDiag.id
    publicIPAddressCount: publicIPAddressNatGatewayAdminCount
    publicIPPrefixesCount: 0
  }
}

module appServicePlanAdminModule 'module/appServicePlan.bicep' = {
  name: 'appServicePlanAdminDeploy'
  params: {
    appServicePlanName: appServicePlanAdminName
    autoscaleEnabled: false
    location: location
    logAnalyticsId: logAnalyticsModule.outputs.id
    storageAccountDiagId: storageAccountDiag.id
    sku: appServiceAdminSku
  }
}

module webAppAdminModule 'module/webApp.bicep' = {
  name: 'webAppAdminDeploy'
  params: {
    appServicePlanId: appServicePlanAdminModule.outputs.id
    appSettings: [
      {
        name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
        value: 'false'
      }
      {
        name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
        value: applicationInsights.outputs.ConnectionString
      }
      {
        name: 'DOCKER_REGISTRY_SERVER_URL'
        value: dockerRegistryAdmin.url
      }
      {
        name: 'DOCKER_REGISTRY_SERVER_USERNAME'
        value: dockerRegistryAdmin.username
      }
      {
        name: 'DOCKER_REGISTRY_SERVER_PASSWORD'
        value: dockerRegistryAdmin.password
      }
    ]
    healthCheckPath: '/health_check.html'
    linuxFxVersion: dockerRegistryAdmin.linuxFxVersion
    appCommandLine: dockerRegistryAdmin.startupCommand
    location: location
    logAnalyticsId: logAnalyticsModule.outputs.id
    storageAccountDiagId: storageAccountDiag.id
    webAppName: webAppAdminName
    subnetResourceId: resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, subnetAdminName)
    ipSecurityRestrictions: [
      {
        ipAddress: 'AzureFrontDoor.Backend'
        action: 'Allow'
        tag: 'ServiceTag'
        priority: 100
        name: frontDoorAdminName
        headers: {
          'X-Azure-FDID': [
            reference(frontDoorAdmin.id, '2020-05-01').frontdoorId
          ]
        }
      }
    ]
    vnetRouteAllEnabled: true
  }
}

resource webAppAdmin_slotconfignames 'Microsoft.Web/sites/config@2021-02-01' = {
  name: '${webAppAdminName}/slotconfignames'
  properties: {
    appSettingNames: [
      'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
      'APPLICATIONINSIGHTS_CONNECTION_STRING'
    ]
  }
  dependsOn: [
    webAppAdminModule
  ]
}

resource webAppAdminSwapSlot 'Microsoft.Web/sites/slots@2021-02-01' = {
  name: '${webAppAdminName}/swap'
  location: location
  properties: {
    serverFarmId: appServicePlanAdminModule.outputs.id
    httpsOnly: true
  }
  dependsOn: [
    webAppAdmin_slotconfignames
  ]
}

// VNET
resource virtualNetwork 'Microsoft.Network/virtualNetworks@2020-11-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
    subnets: [
      {
        name: subnetCpName
        properties: {
          addressPrefix: '10.0.0.0/26'
          natGateway: {
            id: natGatewayCpModules.outputs.id
          }
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
              locations: [
                'japaneast'
                'japanwest'
              ]
            }
            {
              service: 'Microsoft.Sql'
              locations: [
                'japaneast'
              ]
            }
            {
              service: 'Microsoft.AzureCosmosDB'
              locations: [
                '*'
              ]
            }
          ]
          delegations: [
            {
              name: 'Microsoft.Web/serverFarms'
              properties: {
                serviceName: 'Microsoft.Web/serverFarms'
              }
            }
          ]
          privateEndpointNetworkPolicies: 'Enabled'
          privateLinkServiceNetworkPolicies: 'Enabled'
        }
      }
      {
        name: subnetAdminName
        properties: {
          addressPrefix: '10.0.16.0/26'
          natGateway: {
            id: natGatewayAdminModule.outputs.id
          }
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
              locations: [
                'japaneast'
                'japanwest'
              ]
            }
            {
              service: 'Microsoft.Sql'
              locations: [
                'japaneast'
              ]
            }
            {
              service: 'Microsoft.AzureCosmosDB'
              locations: [
                '*'
              ]
            }
          ]
          delegations: [
            {
              name: 'Microsoft.Web/serverFarms'
              properties: {
                serviceName: 'Microsoft.Web/serverFarms'
              }
            }
          ]
          privateEndpointNetworkPolicies: 'Enabled'
          privateLinkServiceNetworkPolicies: 'Enabled'
        }
      }
      {
        name: subnetAseName
        properties: {
          addressPrefix: '10.0.32.0/24'
          natGateway: {
            id: natGatewayCpModules.outputs.id
          }
          serviceEndpoints: [
            {
              service: 'Microsoft.Storage'
              locations: [
                'japaneast'
                'japanwest'
              ]
            }
            {
              service: 'Microsoft.Sql'
              locations: [
                'japaneast'
              ]
            }
            {
              service: 'Microsoft.AzureCosmosDB'
              locations: [
                '*'
              ]
            }
          ]
          delegations: [
            {
              name: 'Microsoft.Web/hostingEnvironments'
              properties: {
                serviceName: 'Microsoft.Web/hostingEnvironments'
              }
            }
          ]
          privateEndpointNetworkPolicies: 'Enabled'
          privateLinkServiceNetworkPolicies: 'Enabled'
        }
      }
      {
        name: subnetBackName
        properties: {
          addressPrefix: '10.0.64.0/24'
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Enabled'
        }
      }
      {
        name: subnetRedisName
        properties: {
          addressPrefix: '10.0.65.0/24'
          privateEndpointNetworkPolicies: 'Enabled'
          privateLinkServiceNetworkPolicies: 'Enabled'
        }
      }
      {
        name: subnetMaintenanceName
        properties: {
          addressPrefix: '10.0.255.0/24'
          privateEndpointNetworkPolicies: 'Enabled'
          privateLinkServiceNetworkPolicies: 'Enabled'
        }
      }
    ]
    enableDdosProtection: false
  }
}

resource virtualNetwork_diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-${vnetName}'
  scope: virtualNetwork
  properties: {
    workspaceId: logAnalyticsModule.outputs.id
    storageAccountId: empty(storageAccountDiag) ? null : storageAccountDiag.id
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

// MySQL
module mySqlModules 'module/mySql.bicep' = [for item in mySqls: {
  name: 'mySqlDeploy-${item.name}'
  params: {
    name: item.name
    location: location
    logAnalyticsId: logAnalyticsModule.outputs.id
    storageAccountDiagId: storageAccountDiag.id
    mySqlAdministratorLogin: item.mySqlAdministratorLogin
    mySqlAdminPassword: item.mySqlAdminPassword
    mySqlSkuName: item.mySqlSkuName
    mySqlStorageMB: item.mySqlStorageMB
    mySqlGeoRedundantBackup: item.mySqlGeoRedundantBackup
    mySqlConfigs: item.mySqlConfigs
    mySqlFirewallRules: item.mySqlFirewallRules
    mySqlStorageAutogrow: item.mySqlStorageAutogrow
    mySqlVirtualNetworkRules: [
      {
        virtualNetworkName: virtualNetwork.name
        subnetName: subnetCpName
      }
      {
        virtualNetworkName: virtualNetwork.name
        subnetName: subnetAdminName
      }
      {
        virtualNetworkName: virtualNetwork.name
        subnetName: subnetAseName
      }
    ]
  }
}]

// CosmosDB
module cosmosDbAccountModule 'module/cosmosDbAccount.bicep' = {
  name: 'cosmosDbAccountDeploy'
  params: {
    location: location
    name: cosmosDbAccountName
    ipRules: cosmosDbAccountIpRules
    subnetIds: [
      resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, subnetCpName)
      resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, subnetAdminName)
      resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, subnetAseName)
    ]
  }
}

// Redis
module redisModule 'module/redis.bicep' = {
  name: 'redisDeploy'
  params: {
    location: location
    logAnalyticsId: logAnalyticsModule.outputs.id
    storageAccountDiagId: storageAccountDiag.id
    redisCacheName: redisCacheName
    storageAccountName: storageAccountRedisCacheName
    redisCacheSKU: redisCacheSKU
    redisCacheCapacity: redisCacheCapacity
    redisCacheFamily: redisCacheFamily
    redisCacheFirewallRules: []
    subnetId: redisVnet ? resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, subnetRedisName) : ''
    staticIp: redisVnet ? '10.0.65.4' : ''
    enableNonSslPort: true
  }
}

module privateEndpointDnsZoneRedisModule 'module/privateEndpointDnsZone.bicep' = if (!redisVnet) {
  name: 'privateEndpointDnsZoneRedisDeploy'
  params: {
    name: 'privatelink.redis.cache.windows.net'
    virtualNetworkId: virtualNetwork.id
  }
}

module privateEndpointRedisModule 'module/privateEndpoint.bicep' = if (!redisVnet) {
  name: 'privateEndpointRedisDeploy'
  params: {
    groupId: 'redisCache'
    location: location
    name: privateEndpointRedisCacheName
    privateDnsZoneId: !redisVnet ? privateEndpointDnsZoneRedisModule.outputs.id : ''
    privateLinkServiceId: redisModule.outputs.id
    subnetId: resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, subnetBackName)
  }
}

// Front Door
resource frontDoorCp 'Microsoft.Network/frontDoors@2020-05-01' = {
  name: frontDoorCpName
  location: 'global'
  properties: {
    enabledState: 'Enabled'
    frontendEndpoints: [
      {
        name: frontDoorEndpontCpName
        properties: {
          hostName: '${frontDoorCpName}.azurefd.net'
          sessionAffinityEnabledState: 'Disabled'
          sessionAffinityTtlSeconds: 0
          webApplicationFirewallPolicyLink: {
            id: wafPolicyPrivate.id
          }
        }
      }
    ]
    healthProbeSettings: [
      {
        name: frontDoorBackendPoolCp.healthProbeSettingName
        properties: {
          path: '/health_check.html'
          protocol: 'Https'
          intervalInSeconds: 30
          healthProbeMethod: 'HEAD'
          enabledState: 'Disabled'
        }
      }
      {
        name: frontDoorBackendPoolCpBlob.healthProbeSettingName
        properties: {
          path: '/'
          protocol: 'Https'
          intervalInSeconds: 30
          healthProbeMethod: 'HEAD'
          enabledState: 'Disabled'
        }
      }
    ]

    loadBalancingSettings: [
      {
        name: frontDoorBackendPoolCp.loadBalancingSettingName
        properties: {
          sampleSize: 4
          successfulSamplesRequired: 2
          additionalLatencyMilliseconds: 0
        }
      }
      {
        name: frontDoorBackendPoolCpBlob.loadBalancingSettingName
        properties: {
          sampleSize: 4
          successfulSamplesRequired: 2
          additionalLatencyMilliseconds: 0
        }
      }
    ]
    backendPools: [
      {
        name: frontDoorBackendPoolCp.name
        properties: {
          backends: [
            {
              address: webAppCpDefaultHostName
              httpPort: 80
              httpsPort: 443
              priority: 1
              weight: 50
              enabledState: 'Enabled'
              backendHostHeader: webAppCpDefaultHostName
            }
          ]
          healthProbeSettings: {
            id: resourceId('Microsoft.Network/frontDoors/healthProbeSettings', frontDoorCpName, frontDoorBackendPoolCp.healthProbeSettingName)
          }
          loadBalancingSettings: {
            id: resourceId('Microsoft.Network/frontDoors/loadBalancingSettings', frontDoorCpName, frontDoorBackendPoolCp.loadBalancingSettingName)
          }
        }
      }
      {
        name: frontDoorBackendPoolCpBlob.name
        properties: {
          backends: [
            {
              address: storageAccountBlobModule.outputs.primaryEndpointBlob
              httpPort: 80
              httpsPort: 443
              priority: 1
              weight: 50
              enabledState: 'Enabled'
              backendHostHeader: storageAccountBlobModule.outputs.primaryEndpointBlob
            }
          ]
          healthProbeSettings: {
            id: resourceId('Microsoft.Network/frontDoors/healthProbeSettings', frontDoorCpName, frontDoorBackendPoolCpBlob.healthProbeSettingName)
          }
          loadBalancingSettings: {
            id: resourceId('Microsoft.Network/frontDoors/loadBalancingSettings', frontDoorCpName, frontDoorBackendPoolCpBlob.loadBalancingSettingName)
          }
        }
      }
    ]
    routingRules: [
      {
        name: 'routingRule-HttpToHttpsRedirect'
        properties: {
          enabledState: 'Enabled'
          acceptedProtocols: [
            'Http'
          ]
          frontendEndpoints: [
            {
              id: resourceId('Microsoft.Network/frontDoors/frontEndEndpoints', frontDoorCpName, frontDoorEndpontCpName)
            }
          ]
          patternsToMatch: [
            '/*'
          ]
          routeConfiguration: {
            '@odata.type': '#Microsoft.Azure.FrontDoor.Models.FrontdoorRedirectConfiguration'
            redirectProtocol: 'HttpsOnly'
            redirectType: 'Moved'
          }
        }
      }
      {
        name: 'routingRule-Root'
        properties: {
          enabledState: 'Enabled'
          acceptedProtocols: [
            'Https'
          ]
          frontendEndpoints: [
            {
              id: resourceId('Microsoft.Network/frontDoors/frontEndEndpoints', frontDoorCpName, frontDoorEndpontCpName)
            }
          ]
          patternsToMatch: [
            '/'
          ]
          routeConfiguration: {
            '@odata.type': '#Microsoft.Azure.FrontDoor.Models.FrontdoorForwardingConfiguration'
            forwardingProtocol: 'HttpsOnly'
            backendPool: {
              id: resourceId('Microsoft.Network/frontDoors/backEndPools', frontDoorCpName, frontDoorBackendPoolCp.name)
            }
            cacheConfiguration: {
              queryParameterStripDirective: 'StripNone'
              dynamicCompression: 'Enabled'
              cacheDuration: 'P1D'
            }
          }
        }
      }
      {
        name: 'routingRule-CatchAllRoot'
        properties: {
          enabledState: 'Enabled'
          acceptedProtocols: [
            'Https'
          ]
          frontendEndpoints: [
            {
              id: resourceId('Microsoft.Network/frontDoors/frontEndEndpoints', frontDoorCpName, frontDoorEndpontCpName)
            }
          ]
          patternsToMatch: [
            '/*'
          ]
          routeConfiguration: {
            '@odata.type': '#Microsoft.Azure.FrontDoor.Models.FrontdoorForwardingConfiguration'
            forwardingProtocol: 'HttpsOnly'
            backendPool: {
              id: resourceId('Microsoft.Network/frontDoors/backEndPools', frontDoorCpName, frontDoorBackendPoolCp.name)
            }
            cacheConfiguration: null
          }
        }
      }
      {
        name: 'routingRule-Blob'
        properties: {
          enabledState: 'Enabled'
          acceptedProtocols: [
            'Https'
          ]
          frontendEndpoints: [
            {
              id: resourceId('Microsoft.Network/frontDoors/frontEndEndpoints', frontDoorCpName, frontDoorEndpontCpName)
            }
          ]
          patternsToMatch: [
            '/blob/*'
          ]
          routeConfiguration: {
            '@odata.type': '#Microsoft.Azure.FrontDoor.Models.FrontdoorForwardingConfiguration'
            forwardingProtocol: 'HttpsOnly'
            backendPool: {
              id: resourceId('Microsoft.Network/frontDoors/backEndPools', frontDoorCpName, frontDoorBackendPoolCpBlob.name)
            }
            cacheConfiguration: null
            customForwardingPath: '/'
          }
        }
      }
    ]
  }
}

module frontDoorDiagModules 'module/frontDoorDiag.bicep' = [for item in frontDoorDiags: {
  name: 'frontDoorDiagDeploy-${item}'
  params: {
    frontDoorName: item
    logAnalyticsId: logAnalyticsModule.outputs.id
    storageAccountDiagId: storageAccountDiag.id
  }
}]

resource frontDoorAdmin 'Microsoft.Network/frontDoors@2020-05-01' = {
  name: frontDoorAdminName
  location: 'global'
  properties: {
    enabledState: 'Enabled'
    frontendEndpoints: [
      {
        name: frontDoorEndpontAdminName
        properties: {
          hostName: '${frontDoorAdminName}.azurefd.net'
          sessionAffinityEnabledState: 'Disabled'
          sessionAffinityTtlSeconds: 0
          webApplicationFirewallPolicyLink: {
            id: wafPolicy.id
          }
        }
      }
    ]
    healthProbeSettings: [
      {
        name: frontDoorBackendPoolAdmin.healthProbeSettingName
        properties: {
          path: '/health_check.html'
          protocol: 'Https'
          intervalInSeconds: 30
          healthProbeMethod: 'HEAD'
          enabledState: 'Disabled'
        }
      }
    ]
    loadBalancingSettings: [
      {
        name: frontDoorBackendPoolAdmin.loadBalancingSettingName
        properties: {
          sampleSize: 4
          successfulSamplesRequired: 2
          additionalLatencyMilliseconds: 0
        }
      }
    ]
    backendPools: [
      {
        name: frontDoorBackendPoolAdmin.name
        properties: {
          backends: [
            {
              address: webAppAdminDefaultHostName
              httpPort: 80
              httpsPort: 443
              priority: 1
              weight: 50
              enabledState: 'Enabled'
              backendHostHeader: webAppAdminDefaultHostName
            }
          ]
          healthProbeSettings: {
            id: resourceId('Microsoft.Network/frontDoors/healthProbeSettings', frontDoorAdminName, frontDoorBackendPoolAdmin.healthProbeSettingName)
          }
          loadBalancingSettings: {
            id: resourceId('Microsoft.Network/frontDoors/loadBalancingSettings', frontDoorAdminName, frontDoorBackendPoolAdmin.loadBalancingSettingName)
          }
        }
      }
    ]
    routingRules: [
      {
        name: 'routingRule-HttpToHttpsRedirect'
        properties: {
          enabledState: 'Enabled'
          acceptedProtocols: [
            'Http'
          ]
          frontendEndpoints: [
            {
              id: resourceId('Microsoft.Network/frontDoors/frontEndEndpoints', frontDoorAdminName, frontDoorEndpontAdminName)
            }
          ]
          patternsToMatch: [
            '/*'
          ]
          routeConfiguration: {
            '@odata.type': '#Microsoft.Azure.FrontDoor.Models.FrontdoorRedirectConfiguration'
            redirectProtocol: 'HttpsOnly'
            redirectType: 'Moved'
          }
        }
      }
      {
        name: 'routingRule-CatchAllRoot'
        properties: {
          enabledState: 'Enabled'
          acceptedProtocols: [
            'Https'
          ]
          frontendEndpoints: [
            {
              id: resourceId('Microsoft.Network/frontDoors/frontEndEndpoints', frontDoorAdminName, frontDoorEndpontAdminName)
            }
          ]
          patternsToMatch: [
            '/*'
          ]
          routeConfiguration: {
            '@odata.type': '#Microsoft.Azure.FrontDoor.Models.FrontdoorForwardingConfiguration'
            forwardingProtocol: 'HttpsOnly'
            backendPool: {
              id: resourceId('Microsoft.Network/frontDoors/backEndPools', frontDoorAdminName, frontDoorBackendPoolAdmin.name)
            }
            cacheConfiguration: null
          }
        }
      }
    ]
  }
}

resource wafPolicy 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@2020-11-01' = {
  name: wafPolicyName
  location: location
  sku: {
    name: 'Classic_AzureFrontDoor'
  }
  properties: {
    policySettings: {
      enabledState: 'Enabled'
      mode: 'Detection'
      requestBodyCheck: 'Enabled'
      redirectUrl: null
      customBlockResponseStatusCode: 403
      customBlockResponseBody: null
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'Microsoft_DefaultRuleSet'
          ruleSetVersion: '1.1'
        }
      ]
    }
    customRules: {
      rules: []
    }
  }
}

resource wafPolicyPrivate 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@2020-11-01' = {
  name: '${wafPolicyName}private'
  location: location
  sku: {
    name: 'Classic_AzureFrontDoor'
  }
  properties: {
    policySettings: {
      enabledState: 'Enabled'
      mode: 'Prevention'
      requestBodyCheck: 'Disabled'
      redirectUrl: null
      customBlockResponseStatusCode: 403
      customBlockResponseBody: null
    }
    managedRules: {
      managedRuleSets: []
    }
    customRules: {
      rules: [
        {
          name: 'AllowIpAddresses'
          priority: 100
          action: 'Block'
          ruleType: 'MatchRule'
          matchConditions: [
            {
              operator: 'IPMatch'
              negateCondition: true
              matchVariable: 'RemoteAddr'
              matchValue: wafPolicyRuleAllowIpAddresses
            }
          ]
        }
      ]
    }
  }
}

// Storage Blob
module storageAccountBlobModule 'module/storageAccount.bicep' = {
  name: 'storageAccountBlobDeploy'
  params: {
    isDiag: true
    kind: 'StorageV2'
    location: location
    logAnalyticsId: logAnalyticsModule.outputs.id
    storageAccountDiagId: storageAccountDiag.id
    name: storageAccountBlobName
    properties: {
      supportsHttpsTrafficOnly: true
      minimumTlsVersion: 'TLS1_2'
      accessTier: 'Hot'
      networkAcls: {
        defaultAction: 'Allow'
      }
    }
    sku: 'Standard_LRS'
  }
}

// Storage EntryLogs
module storageAccountEntrylogsModule 'module/storageAccount.bicep' = {
  name: 'storageAccountEntrylogsDeploy'
  params: {
    isDiag: true
    kind: 'StorageV2'
    location: location
    logAnalyticsId: logAnalyticsModule.outputs.id
    storageAccountDiagId: storageAccountDiag.id
    name: storageAccountEntrylogsName
    properties: {
      supportsHttpsTrafficOnly: true
      minimumTlsVersion: 'TLS1_2'
      accessTier: 'Hot'
      networkAcls: {
        bypass: 'AzureServices'
        defaultAction: 'Deny'
        ipRules: [for item in firewallRuleIpAddresses: {
          value: item.ipAddress
          action: 'Allow'
        }]
        virtualNetworkRules: [
          {
            id: resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, subnetCpName)
          }
          {
            id: resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, subnetAdminName)
          }
          {
            id: resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, subnetAseName)
          }
        ]
      }
    }
    sku: 'Standard_LRS'
  }
}

module storageAccountFuncModule 'module/storageAccount.bicep' = {
  name: 'storageAccountFuncDeploy'
  params: {
    isDiag: false
    kind: 'Storage'
    location: location
    logAnalyticsId: logAnalyticsModule.outputs.id
    storageAccountDiagId: storageAccountDiag.id
    name: storageAccountFuncName
    properties: {}
    sku: 'Standard_LRS'
  }
}

module funcAppAdminBatchFailureModule 'module/funcApp.bicep' = {
  name: 'funcAppAdminBatchFailureDeploy'
  params: {
    name: funcAppAdminBatchFailureName
    location: location
    serverFarmId: appServicePlanAdminModule.outputs.id
    logAnalyticsId: logAnalyticsModule.outputs.id
    storageAccountDiagId: storageAccountDiag.id
    subnetResourceId: resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, subnetAdminName)
    linuxFxVersion: 'DOTNET|6.0'
    appSettings: [
      {
        name: 'FUNCTIONS_EXTENSION_VERSION'
        value: '~4'
      }
      {
        name: 'FUNCTIONS_WORKER_RUNTIME'
        value: 'dotnet'
      }
      {
        name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
        value: applicationInsights.outputs.ConnectionString
      }
      // {
      //   name: 'WEBSITE_TIME_ZONE'
      //   value: 'Asia/Tokyo'
      // }
      {
        name: 'AzureWebJobsStorage'
        value: storageAccountFuncModule.outputs.ConnectionString
      }
      {
        name: 'Azure__Cosmos__AccountName'
        value: 'frontend'
      }
      {
        name: 'Azure__Cosmos__AccountKey'
        value: cosmosDbAccountModule.outputs.primaryMasterKey
      }
      {
        name: 'Azure__Cosmos__AccountEndpoint'
        value: substring(cosmosDbAccountModule.outputs.documentEndpoint, 0, lastIndexOf(cosmosDbAccountModule.outputs.documentEndpoint, '/'))
      }
      {
        name: 'Azure__Cosmos__FrontendDatabase__DatabaseId'
        value: 'frontend'
      }
      {
        name: 'Azure__Cosmos__FrontendDatabase__EntryContainer__ContainerId'
        value: 'entries'
      }
      {
        name: 'Azure__Cosmos__FrontendDatabase__AggregatedEntryLogContainer__ContainerId'
        value: 'aggregatedEntryLog'
      }
      {
        name: 'Azure__Cosmos__FrontendDatabase__HourlyAggregatedEntryLogContainer__ContainerId'
        value: 'hourlyAggregatedEntryLog'
      }
      {
        name: 'Azure__Storage__AccountName'
        value: storageAccountEntrylogsName
      }
      {
        name: 'Azure__Storage__AccountKey'
        value: storageAccountEntrylogsModule.outputs.accountKey
      }
      {
        name: 'Azure__Storage__DefaultEndpointsProtocol'
        value: 'http'
      }
      {
        name: 'Azure__Storage__TableEndpoint'
        value: storageAccountEntrylogsModule.outputs.primaryEndpoints.table
      }
      {
        name: 'Azure__Storage__EntryLogTable__TableName'
        value: 'entrylog'
      }
      {
        name: 'Line__ApiBaseUrl'
        value: 'https://api.line.me'
      }
      {
        name: 'Line__SalesPromotionChannel__ChannelId'
        value: ''
      }
      {
        name: 'Line__SalesPromotionChannel__ChannelSecret'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__CampaignId'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__IncentiveGroupId'
        value: 1
      }
      {
        name: 'Line__SalesPromotion__Incentive__IncentiveGroupApiCode'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__SevenEleven__A'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__SevenEleven__B'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__SevenEleven__C'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__SevenEleven__D'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__SevenEleven__E'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__SevenEleven__F'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__FamilyMart__A'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__FamilyMart__B'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__FamilyMart__C'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__FamilyMart__D'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__FamilyMart__E'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__FamilyMart__F'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__Lawson__A'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__Lawson__B'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__Lawson__C'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__Lawson__D'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__Lawson__E'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__Lawson__F'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__MiniStop__A'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__MiniStop__B'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__MiniStop__C'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__MiniStop__D'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__MiniStop__E'
        value: ''
      }
      {
        name: 'Line__SalesPromotion__Incentive__MiniStop__F'
        value: ''
      }
      {
        name: 'MySql__Server'
        value: mySqlModules[0].outputs.fullyQualifiedDomainName
      }
      {
        name: 'MySql__Port'
        value: 3306
      }
      {
        name: 'MySql__ContentsDatabase__DatabaseName'
        value: ''
      }
      {
        name: 'MySql__ContentsDatabase__UserId'
        value: 'kirinmaster@${mySqlCpName}'
      }
      {
        name: 'MySql__ContentsDatabase__Password'
        value: ''
      }
    ]
    connectionStrings: []
    http20Enabled: true
    vnetRouteAllEnabled: true
  }
  dependsOn: [
    applicationInsights
    storageAccountFuncModule
    cosmosDbAccountModule
    storageAccountEntrylogsModule
  ]
}

resource funcAppAdminBatchFailure_slotconfignames 'Microsoft.Web/sites/config@2021-02-01' = {
  name: '${funcAppAdminBatchFailureName}/slotconfignames'
  properties: {
    appSettingNames: [
      'FUNCTIONS_EXTENSION_VERSION'
      'FUNCTIONS_WORKER_RUNTIME'
      'APPLICATIONINSIGHTS_CONNECTION_STRING'
      'AzureWebJobsStorage'
    ]
  }
  dependsOn: [
    funcAppAdminBatchFailureModule
  ]
}

resource funcAppAdminBatchFailureSwapSlot 'Microsoft.Web/sites/slots@2021-02-01' = {
  name: '${funcAppAdminBatchFailureName}/swap'
  location: location
  properties: {
    serverFarmId: appServicePlanAdminModule.outputs.id
    httpsOnly: true
  }
  dependsOn: [
    funcAppAdminBatchFailure_slotconfignames
  ]
}

module logicAppAdminBatchFailureModule 'module/logicApp.bicep' = {
  name: 'logicAppAdminBatchFailureDeploy'
  params: {
    name: logicAppAdminBatchFailureName
    location: location
    logAnalyticsId: logAnalyticsModule.outputs.id
    storageAccountDiagId: storageAccountDiag.id
  }
}

// DNS Zone
resource dnsZone 'Microsoft.Network/dnsZones@2018-05-01' existing = if (!empty(dnsZoneName)) {
  name: ((!empty(dnsZoneName)) ? dnsZoneName : 'example.com')
}

// Dashboard
module dashboardModule 'dashboard.bicep' = {
  name: 'dashboardDeploy'
  params: {
    appServicePlanCpName: appServicePlanCpName
    cosmosDbAccountName: cosmosDbAccountName
    frontdoorCpName: frontDoorCpName
    location: location
    mysqlAdminName: mySqlAdminName
    mysqlCpName: mySqlCpName
    name: dashboardName
    natGatewayCpName: natGatewayCpName
    redisCacheName: redisCacheName
    storageAccountBlobName: storageAccountBlobName
    storageAccountEnlogName: storageAccountEntrylogsName
    webAppAdminName: webAppAdminName
    webAppCpName: webAppCpName
    applicationInsightsName: applicationInsightsName
    logAnalyticsName: logAnalyticsName
  }
}

// Alert Rule
resource alertSuccessDownloadRawReport 'microsoft.insights/scheduledqueryrules@2021-02-01-preview' = {
  name: 'Success Download Raw Report'
  location: location
  properties: {
    displayName: 'Success Download Raw Report'
    severity: 2
    enabled: true
    evaluationFrequency: 'PT5M'
    scopes: [
      logAnalyticsModule.outputs.id
    ]
    windowSize: 'PT1H'
    criteria: {
      allOf: [
        {
          query: 'AppServiceConsoleLogs\n| where ResultDescription has \'Success download raw report\'\n'
          timeAggregation: 'Count'
          operator: 'LessThan'
          threshold: 1
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [for (item, index) in actionGroupsProperties: actionGroups[index].id]
    }
    autoMitigate: false
  }
}

resource alertFrontDoor_SSLMismatchedSNI 'microsoft.insights/scheduledqueryrules@2021-02-01-preview' = {
  name: 'FrontDoor SSLMismatchedSNI'
  location: location
  properties: {
    displayName: 'FrontDoor SSLMismatchedSNI'
    severity: 2
    enabled: true
    evaluationFrequency: 'PT15M'
    scopes: [
      frontDoorCp.id
    ]
    targetResourceTypes: [
      'Microsoft.Network/frontdoors'
    ]
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          query: 'AzureDiagnostics\n| where Category == "FrontdoorAccessLog"\n| extend errorInfo_s = column_ifexists(\'errorInfo_s\', \'\') \n| where errorInfo_s == "SSLMismatchedSNI"\n'
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [for (item, index) in actionGroupsProperties: actionGroups[index].id]
    }
    autoMitigate: false
  }
}

// Action Group
resource actionGroups 'microsoft.insights/actionGroups@2019-06-01' = [for item in actionGroupsProperties: {
  name: 'ag-${item.groupShortName}'
  location: 'global'
  properties: item
}]
