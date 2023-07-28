param frontDoorCpName string
param backendPoolCpName string

resource frontDoorCp 'Microsoft.Network/frontDoors@2020-05-01' existing = {
  name: frontDoorCpName
}

resource frontDoorCpRuleEngineRoot 'Microsoft.Network/frontDoors/rulesEngines@2020-05-01' = {
  name: 'ruleEngineRoot'
  parent: frontDoorCp
  properties: {
    rules: [
      // {
      //   name: 'cacheControl'
      //   priority: 0
      //   matchProcessingBehavior: 'Continue'
      //   matchConditions: [
      //     {
      //       rulesEngineMatchVariable: 'RequestPath'
      //       rulesEngineOperator: 'Any'
      //       rulesEngineMatchValue: []
      //       negateCondition: false
      //     }
      //   ]
      //   action: {
      //     requestHeaderActions: []
      //     responseHeaderActions: [
      //       {
      //         headerActionType: 'Overwrite'
      //         headerName: 'Cache-Control'
      //         value: 'public, max-age=86400, immutable'
      //       }
      //     ]
      //   }
      // }
      {
        name: 'removeHeader'
        priority: 0
        matchProcessingBehavior: 'Continue'
        matchConditions: [
          {
            rulesEngineMatchVariable: 'RequestPath'
            rulesEngineOperator: 'Any'
            rulesEngineMatchValue: []
            negateCondition: false
          }
        ]
        action: {
          requestHeaderActions: []
          responseHeaderActions: [
            {
              headerActionType: 'Delete'
              headerName: 'Server'
            }
          ]
        }
      }
      {
        name: 'addHeader'
        priority: 1
        matchProcessingBehavior: 'Continue'
        matchConditions: [
          {
            rulesEngineMatchVariable: 'RequestPath'
            rulesEngineOperator: 'Any'
            rulesEngineMatchValue: []
            negateCondition: false
          }
        ]
        action: {
          requestHeaderActions: []
          responseHeaderActions: [
            {
              headerActionType: 'Append'
              headerName: 'X-Frame-Options'
              value: 'SAMEORIGIN'
            }
          ]
        }
      }
    ]
  }
}

resource frontDoorCpRuleEngineCatchAllRoot 'Microsoft.Network/frontDoors/rulesEngines@2020-05-01' = {
  name: 'ruleEngineCatchAllRoot'
  parent: frontDoorCp
  properties: {
    rules: [
      {
        name: 'assets'
        priority: 0
        matchProcessingBehavior: 'Continue'
        matchConditions: [
          {
            rulesEngineMatchVariable: 'RequestPath'
            rulesEngineOperator: 'BeginsWith'
            rulesEngineMatchValue: [
              'assets/'
            ]
            negateCondition: false
          }
        ]
        action: {
          routeConfigurationOverride: {
            '@odata.type': '#Microsoft.Azure.FrontDoor.Models.FrontdoorForwardingConfiguration'
            backendPool: {
              id: resourceId('Microsoft.Network/frontdoors/BackendPools', frontDoorCpName, backendPoolCpName)
            }
            forwardingProtocol: 'HttpsOnly'
            cacheConfiguration: {
              queryParameterStripDirective: 'StripNone'
              dynamicCompression: 'Enabled'
              cacheDuration: 'P1D'
            }
          }
          requestHeaderActions: []
          responseHeaderActions: [
            {
              headerActionType: 'Overwrite'
              headerName: 'Cache-Control'
              value: 'public, max-age=86400, immutable'
            }
          ]
        }
      }
      {
        name: 'removeHeader'
        priority: 1
        matchProcessingBehavior: 'Continue'
        matchConditions: [
          {
            rulesEngineMatchVariable: 'RequestPath'
            rulesEngineOperator: 'Any'
            rulesEngineMatchValue: []
            negateCondition: false
          }
        ]
        action: {
          requestHeaderActions: []
          responseHeaderActions: [
            {
              headerActionType: 'Delete'
              headerName: 'Server'
            }
          ]
        }
      }
      {
        name: 'addHeader'
        priority: 2
        matchProcessingBehavior: 'Continue'
        matchConditions: [
          {
            rulesEngineMatchVariable: 'RequestPath'
            rulesEngineOperator: 'Any'
            rulesEngineMatchValue: []
            negateCondition: false
          }
        ]
        action: {
          requestHeaderActions: []
          responseHeaderActions: [
            {
              headerActionType: 'Append'
              headerName: 'X-Frame-Options'
              value: 'SAMEORIGIN'
            }
          ]
        }
      }
    ]
  }
}

resource frontDoorCpRuleEngineBlob 'Microsoft.Network/frontDoors/rulesEngines@2020-05-01' = {
  name: 'ruleEngineBlob'
  parent: frontDoorCp
  properties: {
    rules: [
      {
        name: 'removeHeader1'
        priority: 0
        matchProcessingBehavior: 'Continue'
        matchConditions: [
          {
            rulesEngineMatchVariable: 'RequestPath'
            rulesEngineOperator: 'Any'
            rulesEngineMatchValue: []
            negateCondition: false
          }
        ]
        action: {
          requestHeaderActions: []
          responseHeaderActions: [
            {
              headerActionType: 'Delete'
              headerName: 'x-ms-version'
            }
            {
              headerActionType: 'Delete'
              headerName: 'x-ms-creation-time'
            }
            {
              headerActionType: 'Delete'
              headerName: 'x-ms-lease-status'
            }
            {
              headerActionType: 'Delete'
              headerName: 'x-ms-lease-state'
            }
            {
              headerActionType: 'Delete'
              headerName: 'x-ms-blob-type'
            }
          ]
        }
      }
      {
        name: 'removeHeader2'
        priority: 1
        matchProcessingBehavior: 'Continue'
        matchConditions: [
          {
            rulesEngineMatchVariable: 'RequestPath'
            rulesEngineOperator: 'Any'
            rulesEngineMatchValue: []
            negateCondition: false
          }
        ]
        action: {
          requestHeaderActions: [
            {
              headerActionType: 'Delete'
              headerName: 'Authorization'
            }
          ]
          responseHeaderActions: [
            {
              headerActionType: 'Delete'
              headerName: 'x-ms-server-encrypted'
            }
            {
              headerActionType: 'Delete'
              headerName: 'x-ms-request-id'
            }
          ]
        }
      }
      {
        name: 'addHeader'
        priority: 2
        matchProcessingBehavior: 'Continue'
        matchConditions: [
          {
            rulesEngineMatchVariable: 'RequestPath'
            rulesEngineOperator: 'Any'
            rulesEngineMatchValue: []
            negateCondition: false
          }
        ]
        action: {
          requestHeaderActions: []
          responseHeaderActions: [
            {
              headerActionType: 'Append'
              headerName: 'X-Frame-Options'
              value: 'SAMEORIGIN'
            }
          ]
        }
      }
    ]
  }
}
