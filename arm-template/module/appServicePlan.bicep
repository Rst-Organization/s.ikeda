param logAnalyticsId string
param storageAccountDiagId string
param location string

// App Service Plan
param appServicePlanName string

@allowed([
  'B1'
  'B2'
  'B3'
  'S1'
  'S2'
  'S3'
  'P1v2'
  'P2v2'
  'P3v2'
  'P4v2'
  'P1v3'
  'P2v3'
  'P3v3'
  'P4v3'
  'I1v2'
  'I2v2'
  'I3v2'
])
@description('App Service Plan\'s pricing tier. Details at https://azure.microsoft.com/en-us/pricing/details/app-service/')
param sku string

// Auto Scale
@description('The minimum capacity.  Autoscale engine will ensure the instance count is at least this value.')
@minValue(1)
@maxValue(30)
param minimumCapacity int = 1

@description('The maximum capacity.  Autoscale engine will ensure the instance count is not greater than this value.')
@minValue(1)
@maxValue(30)
param maximumCapacity int = 30

@description('The default capacity.  Autoscale engine will preventively set the instance count to be this value if it can not find any metric data.')
@minValue(1)
@maxValue(30)
param defaultCapacity int = 1

@description('The metric name.')
param metricName string = 'cpuPercent'

@description('The metric upper threshold.  If the metric value is above this threshold then autoscale engine will initiate scale out action.')
param metricThresholdToScaleOut int = 60

@description('The metric lower threshold.  If the metric value is below this threshold then autoscale engine will initiate scale in action.')
param metricThresholdToScaleIn int = 20

@description('The percentage to increase the instance count when autoscale engine is initiating scale out action.')
param changePercentScaleOut int = 20

@description('The percentage to decrease the instance count when autoscale engine is initiating scale in action.')
param changePercentScaleIn int = 10

@description('A boolean to indicate whether the autoscale policy is enabled or disabled.')
param autoscaleEnabled bool

param aseId string = ''

var isAse = empty(aseId) ? false : true

var appServicePlanProperties = {
  reserved: true
}

var appServicePlanAseProperties = {
  reserved: true
  hostingEnvironmentProfile: {
    id: aseId
  }
}

resource appServicePlan 'Microsoft.Web/serverfarms@2020-12-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: sku
  }
  kind: 'linux'
  properties: isAse ? appServicePlanAseProperties : appServicePlanProperties
  tags: {
    'hidden-related:diagnostics/changeAnalysisScanEnabled': 'true'
  }
}

resource appServicePlan_diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-${appServicePlanName}'
  scope: appServicePlan
  properties: {
    workspaceId: logAnalyticsId
    storageAccountId: empty(storageAccountDiagId) ? null : storageAccountDiagId
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

resource appInsightsAutoScaleSettings 'Microsoft.Insights/autoscalesettings@2015-04-01' = {
  name: 'setting-${appServicePlanName}'
  location: location
  tags: {
    Application_Type: 'web'
    'hidden-link:${appServicePlan.id}': 'Resource'
  }
  properties: {
    profiles: [
      {
        name: 'DefaultAutoscaleProfile'
        capacity: {
          minimum: string(minimumCapacity)
          maximum: string(maximumCapacity)
          default: string(defaultCapacity)
        }
        rules: [
          {
            metricTrigger: {
              metricName: metricName
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT5M'
              statistic: 'Average'
              timeWindow: 'PT10M'
              timeAggregation: 'Average'
              operator: 'GreaterThan'
              threshold: metricThresholdToScaleOut
            }
            scaleAction: {
              direction: 'Increase'
              type: 'PercentChangeCount'
              value: string(changePercentScaleOut)
              cooldown: 'PT10M'
            }
          }
          {
            metricTrigger: {
              metricName: metricName
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT5M'
              statistic: 'Average'
              timeWindow: 'PT10M'
              timeAggregation: 'Average'
              operator: 'LessThan'
              threshold: metricThresholdToScaleIn
            }
            scaleAction: {
              direction: 'Decrease'
              type: 'PercentChangeCount'
              value: string(changePercentScaleIn)
              cooldown: 'PT10M'
            }
          }
        ]
      }
    ]
    enabled: autoscaleEnabled
    targetResourceUri: appServicePlan.id
  }
}

output id string = appServicePlan.id
