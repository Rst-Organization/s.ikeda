param name string
param virtualNetworkId string

var location = 'global'

resource privateDnsZones 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: name
  location: location
  properties: {}
}

resource privateDnsZones_virtualNetworkLinks 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  name: 'link-${name}'
  parent: privateDnsZones
  location: location
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: virtualNetworkId
    }
  }
}

output id string = privateDnsZones.id
