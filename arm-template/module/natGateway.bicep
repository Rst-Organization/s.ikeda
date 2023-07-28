param natGatewayName string
param publicIPAddressName string = 'pip-${natGatewayName}'

@minValue(0)
@maxValue(16)
param publicIPAddressCount int
param publicIPPrefixesName string = 'ippre-${natGatewayName}'

@minValue(0)
@maxValue(8)
param publicIPPrefixesCount int

@minValue(28)
@maxValue(31)
param publicIPPrefixesLength int = 31

@allowed([
  'Standard'
])
param sku string = 'Standard'

@minValue(4)
@maxValue(120)
param idleTimeoutInMinutes int = 4
param location string
param logAnalyticsId string
param storageAccountDiagId string

resource natGateway 'Microsoft.Network/natGateways@2020-05-01' = {
  name: natGatewayName
  location: location
  sku: {
    name: sku
  }
  properties: {
    idleTimeoutInMinutes: idleTimeoutInMinutes
    publicIpAddresses: [for i in range(0, publicIPAddressCount): {
      id: publicIPAddressModules[i].outputs.id
    }]
    publicIpPrefixes: [for i in range(0, publicIPPrefixesCount): {
      id: publicIPPrefixesModules[i].outputs.id
    }]
  }
}

module publicIPAddressModules 'publicIPAddress.bicep' = [for i in range(0, publicIPAddressCount): {
  name: 'publicIPAddressDeploy-${publicIPAddressName}-${padLeft(i + 1, 3, '0')}'
  params: {
    name: '${publicIPAddressName}-${padLeft(i + 1, 3, '0')}'
    location: location
    sku: 'Standard'
    pipAllocationMethod: 'Static'
    logAnalyticsId: logAnalyticsId
    storageAccountDiagId: storageAccountDiagId
    domainNameLabel: '${natGatewayName}-${padLeft(i + 1, 3, '0')}'
  }
}]

module publicIPPrefixesModules 'publicIPPrefixes.bicep' = [for i in range(0, publicIPPrefixesCount): {
  name: 'publicIPPrefixesDeploy-${publicIPPrefixesName}-${padLeft(i + 1, 3, '0')}'
  params: {
    location: location
    name: '${publicIPPrefixesName}-${padLeft(i + 1, 3, '0')}'
    prefixLength: publicIPPrefixesLength
  }
}]

output id string = natGateway.id
