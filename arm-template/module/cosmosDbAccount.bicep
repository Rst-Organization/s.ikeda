param name string
param location string
param ipRules array = [
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
param subnetIds array

resource cosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2021-04-01-preview' = {
  name: name
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    createMode: 'Default'
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: 240
        backupRetentionIntervalInHours: 8
        backupStorageRedundancy: 'Local'
      }
    }
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    enableFreeTier: false
    enableMultipleWriteLocations: false
    ipRules: ipRules
    publicNetworkAccess: 'Enabled'
    virtualNetworkRules: [for item in subnetIds: {
      id: item
    }]
    isVirtualNetworkFilterEnabled: length(subnetIds) > 0 ? true : false
  }
  tags: {
    defaultExperience: 'Core (SQL)'
  }
}

output id string = cosmosDbAccount.id
output documentEndpoint string = cosmosDbAccount.properties.documentEndpoint
output primaryMasterKey string = cosmosDbAccount.listKeys().primaryMasterKey
output connectionString string = cosmosDbAccount.listConnectionStrings().connectionStrings[0].connectionString
