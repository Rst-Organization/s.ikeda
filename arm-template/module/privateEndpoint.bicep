param name string
param location string
param subnetId string
param privateLinkServiceId string
@allowed([
  'mysqlServer'
  'Sql'
  'redisCache'
  'blob'
  'table'
  'queue'
  'file'
])
param groupId string
param privateDnsZoneId string

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2020-11-01' = {
  name: name
  location: location
  properties: {
    subnet: {
      id: subnetId
    }
    privateLinkServiceConnections: [
      {
        name: name
        properties: {
          privateLinkServiceId: privateLinkServiceId
          groupIds: [
            groupId
          ]
        }
      }
    ]
  }
}

resource privateEndpoint_privateDnsZoneGroups 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2020-06-01' = {
  name: '${privateEndpoint.name}/default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config1'
        properties: {
          privateDnsZoneId: privateDnsZoneId
        }
      }
    ]
  }
}
