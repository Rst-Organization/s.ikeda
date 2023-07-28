param name string
param location string

@allowed([
  'Basic'
  'Standard'
])
param sku string = 'Standard'

@allowed([
  'Global'
  'Regional'
])
param tier string = 'Regional'

@allowed([
  'Dynamic'
  'Static'
])
param pipAllocationMethod string = 'Static'

@allowed([
  'IPv4'
  'IPv6'
])
param publicIPAddressVersion string = 'IPv4'
param domainNameLabel string
param idleTimeoutInMinutes int = 4
param logAnalyticsId string
param storageAccountDiagId string

resource publicIPAddress 'Microsoft.Network/publicIPAddresses@2020-11-01' = {
  name: name
  location: location
  sku: {
    name: sku
    tier: tier
  }
  properties: {
    publicIPAddressVersion: publicIPAddressVersion
    publicIPAllocationMethod: pipAllocationMethod
    idleTimeoutInMinutes: idleTimeoutInMinutes
    dnsSettings: {
      domainNameLabel: domainNameLabel
    }
  }
}

resource publicIPAddress_diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-${name}'
  scope: publicIPAddress
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

output id string = publicIPAddress.id
output ipAddress string = publicIPAddress.properties.ipAddress
