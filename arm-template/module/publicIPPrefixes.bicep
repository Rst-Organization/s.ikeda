param name string
param location string

@allowed([
  'Standard'
])
param sku string = 'Standard'

@allowed([
  'Global'
  'Regional'
])
param tier string = 'Regional'

@allowed([
  'IPv4'
  'IPv6'
])
param publicIPAddressVersion string = 'IPv4'

@minValue(28)
@maxValue(31)
param prefixLength int

resource publicIPPrefixes 'Microsoft.Network/publicIPPrefixes@2020-11-01' = {
  name: name
  location: location
  sku: {
    name: sku
    tier: tier
  }
  properties: {
    publicIPAddressVersion: publicIPAddressVersion
    prefixLength: prefixLength
  }
}

output id string = publicIPPrefixes.id
