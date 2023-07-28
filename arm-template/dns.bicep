param dnsZoneNames array

resource dnsZones 'Microsoft.Network/dnsZones@2018-05-01' = [for item in dnsZoneNames: {
  name: item
  location: 'global'
  tags: {}
  properties: {}
  dependsOn: []
}]

