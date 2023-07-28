param name string
param location string

param frontdoorCpName string
param appServicePlanCpName string
param webAppCpName string
param webAppAdminName string
param mysqlCpName string
param mysqlAdminName string
param cosmosDbAccountName string
param redisCacheName string
param natGatewayCpName string
param storageAccountEnlogName string
param storageAccountBlobName string
param applicationInsightsName string
param logAnalyticsName string

resource frontDoorCp 'Microsoft.Network/frontDoors@2020-05-01' existing = {
  name: frontdoorCpName
}

resource appServicePlanCp 'Microsoft.Web/serverfarms@2021-02-01' existing = {
  name: appServicePlanCpName
}

resource webAppCp 'Microsoft.Web/sites@2021-02-01' existing = {
  name: webAppCpName
}

resource webAppAdmin 'Microsoft.Web/sites@2021-02-01' existing = {
  name: webAppAdminName
}

resource mysqlCp 'Microsoft.DBforMySQL/servers@2017-12-01' existing = {
  name: mysqlCpName
}

resource mysqlAdmin 'Microsoft.DBforMySQL/servers@2017-12-01' existing = {
  name: mysqlAdminName
}

resource cosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2021-07-01-preview' existing = {
  name: cosmosDbAccountName
}

resource redisCache 'Microsoft.Cache/redis@2020-12-01' existing = {
  name: redisCacheName
}

resource natGatewayCp 'Microsoft.Network/natGateways@2021-03-01' existing = {
  name: natGatewayCpName
}

resource storageAccountEnlog 'Microsoft.Storage/storageAccounts@2021-06-01' existing = {
  name: storageAccountEnlogName
}

resource storageAccountBlob 'Microsoft.Storage/storageAccounts@2021-06-01' existing = {
  name: storageAccountBlobName
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02-preview' existing = {
  name: applicationInsightsName
}

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2020-08-01' existing = {
  name: logAnalyticsName
}

resource dashboards 'Microsoft.Portal/dashboards@2020-09-01-preview' = {
  name: name
  location: location
  tags: {
    'hidden-title': name
  }
  properties: {
    lenses: [
      {
        order: 0
        parts: [
          {
            position: {
              x: 0
              y: 0
              colSpan: 3
              rowSpan: 1
            }
            metadata: {
              inputs: []
              type: 'Extension/HubsExtension/PartType/MarkdownPart'
              settings: {
                content: {
                  settings: {
                    content: '# Front Door'
                    title: ''
                    subtitle: ''
                    markdownSource: 1
                    markdownUri: null
                  }
                }
              }
            }
          }
          {
            position: {
              x: 3
              y: 0
              colSpan: 2
              rowSpan: 1
            }
            metadata: {
              inputs: []
              type: 'Extension/HubsExtension/PartType/ClockPart'
              settings: {}
            }
          }
          {
            position: {
              x: 5
              y: 0
              colSpan: 3
              rowSpan: 1
            }
            metadata: {
              inputs: []
              type: 'Extension/HubsExtension/PartType/MarkdownPart'
              settings: {
                content: {
                  settings: {
                    content: '# App Service'
                    title: ''
                    subtitle: ''
                    markdownSource: 1
                    markdownUri: null
                  }
                }
              }
            }
          }
          {
            position: {
              x: 10
              y: 0
              colSpan: 3
              rowSpan: 1
            }
            metadata: {
              inputs: []
              type: 'Extension/HubsExtension/PartType/MarkdownPart'
              settings: {
                content: {
                  settings: {
                    content: '# MySQL'
                    title: ''
                    subtitle: ''
                    markdownSource: 1
                    markdownUri: null
                  }
                }
              }
            }
          }
          {
            position: {
              x: 15
              y: 0
              colSpan: 3
              rowSpan: 1
            }
            metadata: {
              inputs: []
              type: 'Extension/HubsExtension/PartType/MarkdownPart'
              settings: {
                content: {
                  settings: {
                    content: '# Cosmos'
                    title: ''
                    subtitle: ''
                    markdownSource: 1
                    markdownUri: null
                  }
                }
              }
            }
          }
          {
            position: {
              x: 20
              y: 0
              colSpan: 3
              rowSpan: 1
            }
            metadata: {
              inputs: []
              type: 'Extension/HubsExtension/PartType/MarkdownPart'
              settings: {
                content: {
                  settings: {
                    content: '# Redis'
                    title: ''
                    subtitle: ''
                    markdownSource: 1
                    markdownUri: null
                  }
                }
              }
            }
          }
          {
            position: {
              x: 25
              y: 0
              colSpan: 3
              rowSpan: 1
            }
            metadata: {
              inputs: []
              type: 'Extension/HubsExtension/PartType/MarkdownPart'
              settings: {
                content: {
                  settings: {
                    content: '# Blob'
                    title: ''
                    subtitle: ''
                    markdownSource: 1
                    markdownUri: null
                  }
                }
              }
            }
          }
          {
            position: {
              x: 0
              y: 1
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: frontDoorCp.id
                          }
                          name: 'BackendRequestCount'
                          aggregationType: 1
                          namespace: 'microsoft.network/frontdoors'
                          metricVisualization: {
                            displayName: 'Backend Request Count'
                          }
                        }
                      ]
                      title: '合計 Backend Request Count 対象 ${frontDoorCp.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 1800000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: frontDoorCp.id
                          }
                          name: 'BackendRequestCount'
                          aggregationType: 1
                          namespace: 'microsoft.network/frontdoors'
                          metricVisualization: {
                            displayName: 'Backend Request Count'
                          }
                        }
                        {
                          resourceMetadata: {
                            id: frontDoorCp.id
                          }
                          name: 'RequestCount'
                          aggregationType: 1
                          namespace: 'microsoft.network/frontdoors'
                          metricVisualization: {
                            displayName: 'Request Count'
                          }
                        }
                      ]
                      title: '合計 Backend Request Count および 合計 Request Count 対象 ${frontDoorCp.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 5
              y: 1
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: webAppCp.id
                          }
                          name: 'Http2xx'
                          aggregationType: 1
                          namespace: 'microsoft.web/sites'
                          metricVisualization: {
                            displayName: 'Http 2xx'
                          }
                        }
                        {
                          resourceMetadata: {
                            id: webAppCp.id
                          }
                          name: 'Http4xx'
                          aggregationType: 1
                          namespace: 'microsoft.web/sites'
                          metricVisualization: {
                            displayName: 'Http 4xx'
                          }
                        }
                        {
                          resourceMetadata: {
                            id: webAppCp.id
                          }
                          name: 'Http5xx'
                          aggregationType: 1
                          namespace: 'microsoft.web/sites'
                          metricVisualization: {
                            displayName: 'Http Server Errors'
                          }
                        }
                      ]
                      title: '合計 Http 2xx、合計 Http 4xx、合計 Http Server Errors 対象 ${webAppCp.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 1800000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: webAppCp.id
                          }
                          name: 'Http2xx'
                          aggregationType: 1
                          namespace: 'microsoft.web/sites'
                          metricVisualization: {
                            displayName: 'Http 2xx'
                          }
                        }
                      ]
                      title: '合計 Http 2xx 対象 ${webAppCp.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 10
              y: 1
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: mysqlCp.id
                          }
                          name: 'cpu_percent'
                          aggregationType: 4
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'CPU percent'
                            resourceDisplayName: mysqlCp.name
                          }
                        }
                        {
                          resourceMetadata: {
                            id: mysqlCp.id
                          }
                          name: 'storage_percent'
                          aggregationType: 4
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'Storage percent'
                            resourceDisplayName: mysqlCp.name
                          }
                        }
                        {
                          resourceMetadata: {
                            id: mysqlCp.id
                          }
                          name: 'io_consumption_percent'
                          aggregationType: 4
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'IO percent'
                            resourceDisplayName: mysqlCp.name
                          }
                        }
                        {
                          resourceMetadata: {
                            id: mysqlCp.id
                          }
                          name: 'memory_percent'
                          aggregationType: 4
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'Memory percent'
                            resourceDisplayName: mysqlCp.name
                          }
                        }
                      ]
                      title: 'リソース使用率 (${mysqlCp.name})'
                      titleKind: 2
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 3600000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: mysqlCp.id
                          }
                          name: 'cpu_percent'
                          aggregationType: 4
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'CPU percent'
                            resourceDisplayName: mysqlCp.name
                          }
                        }
                        {
                          resourceMetadata: {
                            id: mysqlCp.id
                          }
                          name: 'storage_percent'
                          aggregationType: 4
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'Storage percent'
                            resourceDisplayName: mysqlCp.name
                          }
                        }
                        {
                          resourceMetadata: {
                            id: mysqlCp.id
                          }
                          name: 'io_consumption_percent'
                          aggregationType: 4
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'IO percent'
                            resourceDisplayName: mysqlCp.name
                          }
                        }
                        {
                          resourceMetadata: {
                            id: mysqlCp.id
                          }
                          name: 'memory_percent'
                          aggregationType: 4
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'Memory percent'
                            resourceDisplayName: mysqlCp.name
                          }
                        }
                      ]
                      title: 'リソース使用率 (${mysqlCp.name})'
                      titleKind: 2
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 15
              y: 1
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: cosmosDbAccount.id
                          }
                          name: 'TotalRequestUnits'
                          aggregationType: 1
                          namespace: 'microsoft.documentdb/databaseaccounts'
                          metricVisualization: {
                            displayName: 'Total Request Units'
                          }
                        }
                        {
                          resourceMetadata: {
                            id: cosmosDbAccount.id
                          }
                          name: 'TotalRequests'
                          aggregationType: 7
                          namespace: 'microsoft.documentdb/databaseaccounts'
                          metricVisualization: {
                            displayName: 'Total Requests'
                          }
                        }
                        {
                          resourceMetadata: {
                            id: cosmosDbAccount.id
                          }
                          name: 'DocumentCount'
                          aggregationType: 1
                          namespace: 'microsoft.documentdb/databaseaccounts'
                          metricVisualization: {
                            displayName: 'Document Count'
                          }
                        }
                      ]
                      title: '合計 Total Request Units、カウント Total Requests、合計 Document Count 対象 ${cosmosDbAccount.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 86400000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: cosmosDbAccount.id
                          }
                          name: 'TotalRequestUnits'
                          aggregationType: 1
                          namespace: 'microsoft.documentdb/databaseaccounts'
                          metricVisualization: {
                            displayName: 'Total Request Units'
                          }
                        }
                      ]
                      title: '合計 Total Request Units 対象 ${cosmosDbAccount.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 20
              y: 1
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: redisCache.id
                          }
                          name: 'percentProcessorTime'
                          aggregationType: 3
                          namespace: 'microsoft.cache/redis'
                          metricVisualization: {
                            displayName: 'CPU'
                          }
                        }
                        {
                          resourceMetadata: {
                            id: redisCache.id
                          }
                          name: 'serverLoad'
                          aggregationType: 3
                          namespace: 'microsoft.cache/redis'
                          metricVisualization: {
                            displayName: 'Server Load'
                          }
                        }
                      ]
                      title: '最大値 CPU および 最大値 Server Load 対象 ${redisCache.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 86400000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: redisCache.id
                          }
                          name: 'percentProcessorTime'
                          aggregationType: 3
                          namespace: 'microsoft.cache/redis'
                          metricVisualization: {
                            displayName: 'CPU'
                          }
                        }
                        {
                          resourceMetadata: {
                            id: redisCache.id
                          }
                          name: 'serverLoad'
                          aggregationType: 3
                          namespace: 'microsoft.cache/redis'
                          metricVisualization: {
                            displayName: 'Server Load'
                          }
                        }
                      ]
                      title: '最大値 CPU および 最大値 Server Load 対象 ${redisCache.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 25
              y: 1
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: storageAccountEnlog.id
                          }
                          name: 'Transactions'
                          aggregationType: 1
                          namespace: 'microsoft.storage/storageaccounts/blobservices'
                          metricVisualization: {
                            displayName: 'Transactions'
                          }
                        }
                      ]
                      title: '合計 Transactions 対象 ${storageAccountEnlog.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 86400000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: storageAccountBlob.id
                          }
                          name: 'Transactions'
                          aggregationType: 1
                          namespace: 'microsoft.storage/storageaccounts'
                          metricVisualization: {
                            displayName: 'Transactions'
                          }
                        }
                      ]
                      title: '合計 Transactions 対象 ${storageAccountBlob.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 30
              y: 1
              colSpan: 5
              rowSpan: 6
            }
            metadata: {
              inputs: [
                {
                  name: 'resourceTypeMode'
                  isOptional: true
                }
                {
                  name: 'ComponentId'
                  isOptional: true
                }
                {
                  name: 'Scope'
                  value: {
                    resourceIds: [
                      webAppCp.id
                    ]
                  }
                  isOptional: true
                }
                {
                  name: 'PartId'
                  value: '451973b8-e021-4d35-8091-9390164d6510'
                  isOptional: true
                }
                {
                  name: 'Version'
                  value: '2.0'
                  isOptional: true
                }
                {
                  name: 'TimeRange'
                  value: 'P1D'
                  isOptional: true
                }
                {
                  name: 'DashboardId'
                  isOptional: true
                }
                {
                  name: 'DraftRequestParameters'
                  value: {
                    scope: 'hierarchy'
                  }
                  isOptional: true
                }
                {
                  name: 'Query'
                  value: 'AppServiceHTTPLogs\n// | where TimeGenerated >= datetime(\'2021-10-04 15:55:00.000\')\n// | where TimeGenerated >= datetime(\'2021-10-05 02:00:00.000\')\n| where _ResourceId == \'${webAppCp.id}\'\n// | where ScStatus >= 400\n// | sort by TimeGenerated\n| where UserAgent <> \'Edge Health Probe\'\n| summarize count() by ScStatus\n| sort by ScStatus\n\n'
                  isOptional: true
                }
                {
                  name: 'ControlType'
                  value: 'AnalyticsGrid'
                  isOptional: true
                }
                {
                  name: 'SpecificChart'
                  isOptional: true
                }
                {
                  name: 'PartTitle'
                  value: 'Analytics'
                  isOptional: true
                }
                {
                  name: 'PartSubTitle'
                  value: webAppCp.name
                  isOptional: true
                }
                {
                  name: 'Dimensions'
                  isOptional: true
                }
                {
                  name: 'LegendOptions'
                  isOptional: true
                }
                {
                  name: 'IsQueryContainTimeRange'
                  value: false
                  isOptional: true
                }
              ]
              type: 'Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart'
              settings: {
                content: {
                  Query: 'AppServiceHTTPLogs\n| where UserAgent <> \'Edge Health Probe\'\n| summarize count() by ScStatus\n| sort by ScStatus\n\n'
                  PartTitle: 'Count Status'
                }
              }
            }
          }
          {
            position: {
              x: 35
              y: 1
              colSpan: 5
              rowSpan: 6
            }
            metadata: {
              inputs: [
                {
                  name: 'resourceTypeMode'
                  isOptional: true
                }
                {
                  name: 'ComponentId'
                  isOptional: true
                }
                {
                  name: 'Scope'
                  value: {
                    resourceIds: [
                      webAppCp.id
                    ]
                  }
                  isOptional: true
                }
                {
                  name: 'PartId'
                  value: '8720c97c-2c53-49b5-876c-1c171512331d'
                  isOptional: true
                }
                {
                  name: 'Version'
                  value: '2.0'
                  isOptional: true
                }
                {
                  name: 'TimeRange'
                  value: 'P1D'
                  isOptional: true
                }
                {
                  name: 'DashboardId'
                  isOptional: true
                }
                {
                  name: 'DraftRequestParameters'
                  value: {
                    scope: 'hierarchy'
                  }
                  isOptional: true
                }
                {
                  name: 'Query'
                  value: 'AppServiceHTTPLogs\n| where ScStatus >= 400\n// | where TimeGenerated >= datetime(\'2021-10-05 03:27\') and TimeGenerated <= datetime(\'2021-10-05 04:27\')\n| summarize count() by CsUriStem, ScStatus\n| sort by ScStatus\n'
                  isOptional: true
                }
                {
                  name: 'ControlType'
                  value: 'AnalyticsGrid'
                  isOptional: true
                }
                {
                  name: 'SpecificChart'
                  isOptional: true
                }
                {
                  name: 'PartTitle'
                  value: 'Analytics'
                  isOptional: true
                }
                {
                  name: 'PartSubTitle'
                  value: webAppCp.name
                  isOptional: true
                }
                {
                  name: 'Dimensions'
                  isOptional: true
                }
                {
                  name: 'LegendOptions'
                  isOptional: true
                }
                {
                  name: 'IsQueryContainTimeRange'
                  value: false
                  isOptional: true
                }
              ]
              type: 'Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart'
              settings: {
                content: {
                  PartTitle: 'Http Status >= 400 Path'
                }
              }
            }
          }
          {
            position: {
              x: 0
              y: 4
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: frontDoorCp.id
                          }
                          name: 'BackendRequestLatency'
                          aggregationType: 4
                          namespace: 'microsoft.network/frontdoors'
                          metricVisualization: {
                            displayName: 'Backend Request Latency'
                          }
                        }
                        {
                          resourceMetadata: {
                            id: frontDoorCp.id
                          }
                          name: 'TotalLatency'
                          aggregationType: 4
                          namespace: 'microsoft.network/frontdoors'
                          metricVisualization: {
                            displayName: 'Total Latency'
                          }
                        }
                      ]
                      title: '平均 Backend Request Latency および 平均 Total Latency 対象 ${frontDoorCp.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 1800000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: frontDoorCp.id
                          }
                          name: 'BackendRequestLatency'
                          aggregationType: 4
                          namespace: 'microsoft.network/frontdoors'
                          metricVisualization: {
                            displayName: 'Backend Request Latency'
                          }
                        }
                        {
                          resourceMetadata: {
                            id: frontDoorCp.id
                          }
                          name: 'TotalLatency'
                          aggregationType: 4
                          namespace: 'microsoft.network/frontdoors'
                          metricVisualization: {
                            displayName: 'Total Latency'
                          }
                        }
                      ]
                      title: '平均 Backend Request Latency および 平均 Total Latency 対象 ${frontDoorCp.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 5
              y: 4
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: webAppCp.id
                          }
                          name: 'Http4xx'
                          aggregationType: 1
                          namespace: 'microsoft.web/sites'
                          metricVisualization: {
                            displayName: 'Http 4xx'
                          }
                        }
                        {
                          resourceMetadata: {
                            id: webAppCp.id
                          }
                          name: 'Http5xx'
                          aggregationType: 1
                          namespace: 'microsoft.web/sites'
                          metricVisualization: {
                            displayName: 'Http Server Errors'
                          }
                        }
                      ]
                      title: '合計 Http 4xx および 合計 Http Server Errors 対象 ${webAppCp.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 3600000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: webAppCp.id
                          }
                          name: 'Http4xx'
                          aggregationType: 1
                          namespace: 'microsoft.web/sites'
                          metricVisualization: {
                            displayName: 'Http 4xx'
                          }
                        }
                        {
                          resourceMetadata: {
                            id: webAppCp.id
                          }
                          name: 'Http5xx'
                          aggregationType: 1
                          namespace: 'microsoft.web/sites'
                          metricVisualization: {
                            displayName: 'Http Server Errors'
                          }
                        }
                      ]
                      title: '合計 Http 4xx および 合計 Http Server Errors 対象 ${webAppCp.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 10
              y: 4
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: mysqlCp.id
                          }
                          name: 'active_connections'
                          aggregationType: 4
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'Active Connections'
                            resourceDisplayName: mysqlCp.name
                          }
                        }
                      ]
                      title: '平均 Active Connections 対象 ${mysqlCp.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 3600000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: mysqlCp.id
                          }
                          name: 'active_connections'
                          aggregationType: 4
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'Active Connections'
                            resourceDisplayName: mysqlCp.name
                          }
                        }
                        {
                          resourceMetadata: {
                            id: mysqlCp.id
                          }
                          name: 'connections_failed'
                          aggregationType: 1
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'Failed Connections'
                            resourceDisplayName: mysqlCp.name
                          }
                        }
                      ]
                      title: '平均 Active Connections および 合計 Failed Connections 対象 ${mysqlCp.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 15
              y: 4
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: cosmosDbAccount.id
                          }
                          name: 'DocumentCount'
                          aggregationType: 1
                          namespace: 'microsoft.documentdb/databaseaccounts'
                          metricVisualization: {
                            displayName: 'Document Count'
                          }
                        }
                      ]
                      title: '合計 Document Count 対象 ${cosmosDbAccount.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 1800000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: cosmosDbAccount.id
                          }
                          name: 'DocumentCount'
                          aggregationType: 1
                          namespace: 'microsoft.documentdb/databaseaccounts'
                          metricVisualization: {
                            displayName: 'Document Count'
                          }
                        }
                      ]
                      title: '合計 Document Count 対象 ${cosmosDbAccount.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 20
              y: 4
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: redisCache.id
                          }
                          name: 'cachehits'
                          aggregationType: 1
                          namespace: 'microsoft.cache/redis'
                          metricVisualization: {
                            displayName: 'Cache Hits'
                          }
                        }
                      ]
                      title: '合計 Cache Hits 対象 ${redisCache.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 86400000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: redisCache.id
                          }
                          name: 'cachehits'
                          aggregationType: 1
                          namespace: 'microsoft.cache/redis'
                          metricVisualization: {
                            displayName: 'Cache Hits'
                          }
                        }
                      ]
                      title: '合計 Cache Hits 対象 ${redisCache.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 25
              y: 4
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: storageAccountEnlog.id
                          }
                          name: 'Transactions'
                          aggregationType: 1
                          namespace: 'microsoft.storage/storageaccounts/tableservices'
                          metricVisualization: {
                            displayName: 'Transactions'
                          }
                        }
                      ]
                      title: '合計 Transactions 対象 ${storageAccountEnlog.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 86400000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: storageAccountEnlog.id
                          }
                          name: 'Transactions'
                          aggregationType: 1
                          namespace: 'microsoft.storage/storageaccounts/tableservices'
                          metricVisualization: {
                            displayName: 'Transactions'
                          }
                        }
                      ]
                      title: '合計 Transactions 対象 ${storageAccountEnlog.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 0
              y: 7
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: frontDoorCp.id
                          }
                          name: 'BackendHealthPercentage'
                          aggregationType: 4
                          namespace: 'microsoft.network/frontdoors'
                          metricVisualization: {
                            displayName: 'Backend Health Percentage'
                            resourceDisplayName: frontDoorCp.name
                          }
                        }
                      ]
                      title: 'バックエンド正常性の割合'
                      titleKind: 2
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      grouping: {
                        dimension: 'Backend'
                      }
                      timespan: {
                        relative: {
                          duration: 3600000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: frontDoorCp.id
                          }
                          name: 'BackendHealthPercentage'
                          aggregationType: 4
                          namespace: 'microsoft.network/frontdoors'
                          metricVisualization: {
                            displayName: 'Backend Health Percentage'
                            resourceDisplayName: frontDoorCp.name
                          }
                        }
                      ]
                      title: 'バックエンド正常性の割合'
                      titleKind: 2
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                      grouping: {
                        dimension: 'Backend'
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 5
              y: 7
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: appServicePlanCp.id
                          }
                          name: 'cpuPercent'
                          aggregationType: 3
                          namespace: 'microsoft.web/serverfarms'
                          metricVisualization: {
                            displayName: 'CPU Percentage'
                          }
                        }
                        {
                          resourceMetadata: {
                            id: appServicePlanCp.id
                          }
                          name: 'MemoryPercentage'
                          aggregationType: 3
                          namespace: 'microsoft.web/serverfarms'
                          metricVisualization: {
                            displayName: 'Memory Percentage'
                          }
                        }
                      ]
                      title: '最大値 CPU Percentage および 最大値 Memory Percentage 対象 ${appServicePlanCp.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 3600000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: appServicePlanCp.id
                          }
                          name: 'cpuPercent'
                          aggregationType: 4
                          namespace: 'microsoft.web/serverfarms'
                          metricVisualization: {
                            displayName: 'CPU Percentage'
                          }
                        }
                        {
                          resourceMetadata: {
                            id: appServicePlanCp.id
                          }
                          name: 'MemoryPercentage'
                          aggregationType: 4
                          namespace: 'microsoft.web/serverfarms'
                          metricVisualization: {
                            displayName: 'Memory Percentage'
                          }
                        }
                      ]
                      title: '平均 CPU Percentage および 平均 Memory Percentage 対象 ${appServicePlanCp.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 10
              y: 7
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: mysqlAdmin.id
                          }
                          name: 'cpu_percent'
                          aggregationType: 4
                          metricVisualization: {
                            displayName: 'CPU percent'
                            resourceDisplayName: mysqlAdmin.name
                          }
                        }
                        {
                          resourceMetadata: {
                            id: mysqlAdmin.id
                          }
                          name: 'storage_percent'
                          aggregationType: 4
                          metricVisualization: {
                            displayName: 'Storage percent'
                            resourceDisplayName: mysqlAdmin.name
                          }
                        }
                      ]
                      title: 'リソース使用率 (${mysqlAdmin.name})'
                      titleKind: 2
                      visualization: {
                        chartType: 2
                      }
                      openBladeOnClick: {
                        openBlade: true
                      }
                    }
                  }
                  isOptional: true
                }
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: mysqlAdmin.id
                          }
                          name: 'cpu_percent'
                          aggregationType: 4
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'CPU percent'
                            resourceDisplayName: mysqlAdmin.name
                          }
                        }
                        {
                          resourceMetadata: {
                            id: mysqlAdmin.id
                          }
                          name: 'storage_percent'
                          aggregationType: 4
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'Storage percent'
                            resourceDisplayName: mysqlAdmin.name
                          }
                        }
                        {
                          resourceMetadata: {
                            id: mysqlAdmin.id
                          }
                          name: 'io_consumption_percent'
                          aggregationType: 4
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'IO percent'
                            resourceDisplayName: mysqlAdmin.name
                          }
                        }
                        {
                          resourceMetadata: {
                            id: mysqlAdmin.id
                          }
                          name: 'memory_percent'
                          aggregationType: 4
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'Memory percent'
                            resourceDisplayName: mysqlAdmin.name
                          }
                        }
                      ]
                      title: 'リソース使用率 (${mysqlAdmin.name})'
                      titleKind: 2
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 20
              y: 7
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: redisCache.id
                          }
                          name: 'connectedclients'
                          aggregationType: 3
                          namespace: 'microsoft.cache/redis'
                          metricVisualization: {
                            displayName: 'Connected Clients'
                          }
                        }
                      ]
                      title: '最大値 Connected Clients 対象 ${redisCache.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 86400000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: redisCache.id
                          }
                          name: 'connectedclients'
                          aggregationType: 3
                          namespace: 'microsoft.cache/redis'
                          metricVisualization: {
                            displayName: 'Connected Clients'
                          }
                        }
                      ]
                      title: '最大値 Connected Clients 対象 ${redisCache.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 30
              y: 7
              colSpan: 10
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'resourceTypeMode'
                  isOptional: true
                }
                {
                  name: 'ComponentId'
                  isOptional: true
                }
                {
                  name: 'Scope'
                  value: {
                    resourceIds: [
                      webAppAdmin.id
                    ]
                  }
                  isOptional: true
                }
                {
                  name: 'PartId'
                  value: '14fbda08-1855-4edb-ab01-14ddb10feed3'
                  isOptional: true
                }
                {
                  name: 'Version'
                  value: '2.0'
                  isOptional: true
                }
                {
                  name: 'TimeRange'
                  value: 'P1D'
                  isOptional: true
                }
                {
                  name: 'DashboardId'
                  isOptional: true
                }
                {
                  name: 'DraftRequestParameters'
                  value: {
                    scope: 'hierarchy'
                  }
                  isOptional: true
                }
                {
                  name: 'Query'
                  value: 'AppServiceConsoleLogs\n| sort by TimeGenerated\n| where ResultDescription has \'Success download raw report\'\n// | where TimeGenerated > ago(2h)\n// | summarize AggregatedValue = count() by bin(TimeGenerated, 2h)\n'
                  isOptional: true
                }
                {
                  name: 'ControlType'
                  value: 'AnalyticsGrid'
                  isOptional: true
                }
                {
                  name: 'SpecificChart'
                  isOptional: true
                }
                {
                  name: 'PartTitle'
                  value: 'Analytics'
                  isOptional: true
                }
                {
                  name: 'PartSubTitle'
                  value: webAppAdmin.name
                  isOptional: true
                }
                {
                  name: 'Dimensions'
                  isOptional: true
                }
                {
                  name: 'LegendOptions'
                  isOptional: true
                }
                {
                  name: 'IsQueryContainTimeRange'
                  value: false
                  isOptional: true
                }
              ]
              type: 'Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart'
              settings: {
                content: {
                  PartTitle: 'Success download raw report'
                }
              }
            }
          }
          {
            position: {
              x: 0
              y: 10
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: applicationInsights.id
                          }
                          name: 'availabilityResults/availabilityPercentage'
                          aggregationType: 4
                          namespace: 'microsoft.insights/components/kusto'
                          metricVisualization: {
                            displayName: 'Availability'
                          }
                        }
                      ]
                      title: 'Test name による 平均 Availability 対象 ${applicationInsights.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position:2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      grouping: {
                        dimension: 'availabilityResult/name'
                        sort: 2
                        top: 10
                      }
                      timespan: {
                        relative: {
                          duration: 86400000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: applicationInsights.id
                          }
                          name: 'availabilityResults/availabilityPercentage'
                          aggregationType: 4
                          namespace: 'microsoft.insights/components/kusto'
                          metricVisualization: {
                            displayName: 'Availability'
                          }
                        }
                      ]
                      title: 'Test name による 平均 Availability 対象 ${applicationInsights.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType:2
                          }
                          y: {
                            isVisible: true
                            axisType:1
                          }
                        }
                        disablePinning: true
                      }
                      grouping: {
                        dimension: 'availabilityResult/name'
                        sort: 2
                        top: 10
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 5
              y: 10
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: webAppCp.id
                          }
                          name: 'CpuTime'
                          aggregationType: 3
                          namespace: 'microsoft.web/sites'
                          metricVisualization: {
                            displayName: 'CPU Time'
                          }
                        }
                        {
                          resourceMetadata: {
                            id: webAppCp.id
                          }
                          name: 'HttpResponseTime'
                          aggregationType: 3
                          namespace: 'microsoft.web/sites'
                          metricVisualization: {
                            displayName: 'Response Time'
                          }
                        }
                      ]
                      title: '最大値 CPU Time および 最大値 Response Time 対象 ${webAppCp.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 1800000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: webAppCp.id
                          }
                          name: 'CpuTime'
                          aggregationType: 3
                          namespace: 'microsoft.web/sites'
                          metricVisualization: {
                            displayName: 'CPU Time'
                          }
                        }
                        {
                          resourceMetadata: {
                            id: webAppCp.id
                          }
                          name: 'HttpResponseTime'
                          aggregationType: 3
                          namespace: 'microsoft.web/sites'
                          metricVisualization: {
                            displayName: 'Response Time'
                          }
                        }
                      ]
                      title: '最大値 CPU Time および 最大値 Response Time 対象 ${webAppCp.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 10
              y: 10
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: mysqlCp.id
                          }
                          name: 'connections_failed'
                          aggregationType: 1
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'Failed Connections'
                            resourceDisplayName: mysqlCp.name
                          }
                        }
                      ]
                      title: '合計 Failed Connections 対象 ${mysqlCp.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 3600000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: mysqlAdmin.id
                          }
                          name: 'active_connections'
                          aggregationType: 4
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'Active Connections'
                            resourceDisplayName: mysqlAdmin.name
                          }
                        }
                        {
                          resourceMetadata: {
                            id: mysqlAdmin.id
                          }
                          name: 'connections_failed'
                          aggregationType: 1
                          namespace: 'microsoft.dbformysql/servers'
                          metricVisualization: {
                            displayName: 'Failed Connections'
                            resourceDisplayName: mysqlAdmin.name
                          }
                        }
                      ]
                      title: '平均 Active Connections および 合計 Failed Connections 対象 ${mysqlAdmin.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 30
              y: 10
              colSpan: 10
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'resourceTypeMode'
                  isOptional: true
                }
                {
                  name: 'ComponentId'
                  isOptional: true
                }
                {
                  name: 'Scope'
                  value: {
                    resourceIds: [
                      logAnalytics.id
                    ]
                  }
                  isOptional: true
                }
                {
                  name: 'PartId'
                  value: '13719498-1313-4076-8221-19ad1377094d'
                  isOptional: true
                }
                {
                  name: 'Version'
                  value: '2.0'
                  isOptional: true
                }
                {
                  name: 'TimeRange'
                  value: 'PT1H'
                  isOptional: true
                }
                {
                  name: 'DashboardId'
                  isOptional: true
                }
                {
                  name: 'DraftRequestParameters'
                  isOptional: true
                }
                {
                  name: 'Query'
                  value: 'AppServiceHTTPLogs\n| where ScStatus == 500\n| where UserAgent !has (\'Apache-HttpClient\')\n'
                  isOptional: true
                }
                {
                  name: 'ControlType'
                  value: 'AnalyticsGrid'
                  isOptional: true
                }
                {
                  name: 'SpecificChart'
                  isOptional: true
                }
                {
                  name: 'PartTitle'
                  value: 'Analytics'
                  isOptional: true
                }
                {
                  name: 'PartSubTitle'
                  value: logAnalytics.name
                  isOptional: true
                }
                {
                  name: 'Dimensions'
                  isOptional: true
                }
                {
                  name: 'LegendOptions'
                  isOptional: true
                }
                {
                  name: 'IsQueryContainTimeRange'
                  value: false
                  isOptional: true
                }

              ]
              type: 'Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart'
              settings: {
                content: {
                  Query: 'AppServiceHTTPLogs\n| where ScStatus >= 500\n| where UserAgent !has (\'Apache-HttpClient\')\n| sort by TimeGenerated\n'
                  PartTitle: 'Http Status >= 500 Detail'
                  PartSubTitle: 'AppServiceHTTPLogs'
                }
              }  
            }
          }
          {
            position: {
              x: 0
              y: 13
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'resourceTypeMode'
                  isOptional: true
                }
                {
                  name: 'ComponentId'
                  isOptional: true
                }
                {
                  name: 'Scope'
                  value: {
                    resourceIds: [
                      frontDoorCp.id
                    ]
                  }
                  isOptional: true
                }
                {
                  name: 'PartId'
                  value: '609f45bb-a852-4d66-a763-eb5e62913ba1'
                  isOptional: true
                }
                {
                  name: 'Version'
                  value: '2.0'
                  isOptional: true
                }
                {
                  name: 'TimeRange'
                  value: 'PT12H'
                  isOptional: true
                }
                {
                  name: 'DashboardId'
                  isOptional: true
                }
                {
                  name: 'DraftRequestParameters'
                  value: {
                    scope: 'hierarchy'
                  }
                  isOptional: true
                }
                {
                  name: 'Query'
                  value: 'AzureDiagnostics\n| where Category == \'FrontdoorAccessLog\'\n| extend errorInfo_s = column_ifexists(\'errorInfo_s\', \'\') \n| where errorInfo_s <> \'NoError\'\n| project TimeGenerated, errorInfo_s\n| summarize count() by bin(TimeGenerated, 1m), errorInfo_s\n| render timechart\n\n'
                  isOptional: true
                }
                {
                  name: 'ControlType'
                  value: 'FrameControlChart'
                  isOptional: true
                }
                {
                  name: 'SpecificChart'
                  value: 'Line'
                  isOptional: true
                }
                {
                  name: 'PartTitle'
                  value: 'Analytics'
                  isOptional: true
                }
                {
                  name: 'PartSubTitle'
                  value: frontDoorCp.name
                  isOptional: true
                }
                {
                  name: 'Dimensions'
                  value: {
                    xAxis: {
                      name: 'TimeGenerated'
                      type: 'datetime'
                    }
                    yAxis: [
                      {
                        name: 'count_'
                        type: 'long'
                      }
                    ]
                    splitBy: [
                      {
                        name: 'errorInfo_s'
                        type: 'string'
                      }
                    ]
                    aggregation: 'Sum'
                  }
                  isOptional: true
                }
                {
                  name: 'LegendOptions'
                  value: {
                    isEnabled: true
                    position: 'Bottom'
                  }
                  isOptional: true
                }
                {
                  name: 'IsQueryContainTimeRange'
                  value: false
                  isOptional: true
                }
              ]
              type: 'Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart'
              settings: {
                content: {
                  Query: 'AzureDiagnostics\n| where Category == \'FrontdoorAccessLog\'\n| extend errorInfo_s = column_ifexists(\'errorInfo_s\', \'\') \n| where errorInfo_s <> \'NoError\'\n| project TimeGenerated, errorInfo_s\n| summarize count() by bin(TimeGenerated, 5m), errorInfo_s\n| render timechart\n\n'
                }
              }
              partHeader: {
                title: 'FrontdoorAccessLog errorInfo_s'
                subtitle: ''
              }
            }
          }
          {
            position: {
              x: 5
              y: 13
              colSpan: 5
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'options'
                  value: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: natGatewayCp.id
                          }
                          name: 'SNATConnectionCount'
                          aggregationType: 1
                          namespace: 'microsoft.network/natgateways'
                          metricVisualization: {
                            displayName: 'SNAT Connection Count'
                          }
                        }
                      ]
                      title: '合計 SNAT Connection Count 対象 ${natGatewayCp.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                      }
                      timespan: {
                        relative: {
                          duration: 3600000
                        }
                        showUTCTime: false
                        grain: 1
                      }
                    }
                  }
                  isOptional: true
                }
                {
                  name: 'sharedTimeRange'
                  isOptional: true
                }
              ]
              type: 'Extension/HubsExtension/PartType/MonitorChartPart'
              settings: {
                content: {
                  options: {
                    chart: {
                      metrics: [
                        {
                          resourceMetadata: {
                            id: natGatewayCp.id
                          }
                          name: 'SNATConnectionCount'
                          aggregationType: 1
                          namespace: 'microsoft.network/natgateways'
                          metricVisualization: {
                            displayName: 'SNAT Connection Count'
                          }
                        }
                      ]
                      title: '合計 SNAT Connection Count 対象 ${natGatewayCp.name}'
                      titleKind: 1
                      visualization: {
                        chartType: 2
                        legendVisualization: {
                          isVisible: true
                          position: 2
                          hideSubtitle: false
                        }
                        axisVisualization: {
                          x: {
                            isVisible: true
                            axisType: 2
                          }
                          y: {
                            isVisible: true
                            axisType: 1
                          }
                        }
                        disablePinning: true
                      }
                    }
                  }
                }
              }
            }
          }
          {
            position: {
              x: 30
              y: 13
              colSpan: 10
              rowSpan: 3
            }
            metadata: {
              inputs: [
                {
                  name: 'resourceTypeMode'
                  isOptional: true
                }
                {
                  name: 'ComponentId'
                  isOptional: true
                }
                {
                  name: 'Scope'
                  value: {
                    resourceIds: [
                      logAnalytics.id
                    ]
                  }
                  isOptional: true
                }
                {
                  name: 'PartId'
                  value: '0837fa02-2224-4972-a812-0a9db4a128c2'
                  isOptional: true
                }
                {
                  name: 'Version'
                  value: '2.0'
                  isOptional: true
                }
                {
                  name: 'TimeRange'
                  value: 'PT1H'
                  isOptional: true
                }
                {
                  name: 'DashboardId'
                  isOptional: true
                }
                {
                  name: 'DraftRequestParameters'
                  isOptional: true
                }
                {
                  name: 'Query'
                  value: 'AppServiceConsoleLogs\n| where ResultDescription has \'exception\'\n| order by TimeGenerated desc'
                  isOptional: true
                }
                {
                  name: 'ControlType'
                  value: 'AnalyticsGrid'
                  isOptional: true
                }
                {
                  name: 'SpecificChart'
                  isOptional: true
                }
                {
                  name: 'PartTitle'
                  value: 'Analytics'
                  isOptional: true
                }
                {
                  name: 'PartSubTitle'
                  value: logAnalytics.name
                  isOptional: true
                }
                {
                  name: 'Dimensions'
                  isOptional: true
                }
                {
                  name: 'LegendOptions'
                  isOptional: true
                }
                {
                  name: 'IsQueryContainTimeRange'
                  value: false
                  isOptional: true
                }
              ]
              type: 'Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart'
              settings: {
                content: {
                  PartTitle: 'Exception'
                  PartSubTitle: 'AppServiceConsoleLogs'
                }
              }
            }
          }
        ]
      }
    ]

    metadata: {
      model: {
        timeRange: {
          value: {
            relative: {
              duration: 24
              timeUnit: 1
            }
          }
          type: 'MsPortalFx.Composition.Configuration.ValueTypes.TimeRange'
        }
        filterLocale: {
          value: 'ja-jp'
        }
        filters: {
          value: {
            MsPortalFx_TimeRange: {
              model: {
                format: 'local'
                granularity: 'auto'
                relative: '1h'
              }
              displayCache: {
                name: '現地時刻'
                value: '過去 1 時間'
              }
              filteredPartIds: [
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b0403f'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b04041'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b04043'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b04045'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b04047'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b04049'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b0404f'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b04051'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b04053'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b04055'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b04057'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b04059'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b0405b'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b0405d'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b0405f'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b04061'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b04065'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b04067'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b04069'
                'StartboardPart-MonitorChartPart-fe7c2ead-593b-4082-a1a9-91b031b0406d'
                'StartboardPart-LogsDashboardPart-fe7c2ead-593b-4082-a1a9-91b031b0404b'
                'StartboardPart-LogsDashboardPart-fe7c2ead-593b-4082-a1a9-91b031b0404d'
                'StartboardPart-LogsDashboardPart-fe7c2ead-593b-4082-a1a9-91b031b04063'
                'StartboardPart-LogsDashboardPart-fe7c2ead-593b-4082-a1a9-91b031b0406b'
                'StartboardPart-LogsDashboardPart-fe7c2ead-593b-4082-a1a9-91b031b0406f'
              ]
            }
          }
        }
      }
    }
  }
}
