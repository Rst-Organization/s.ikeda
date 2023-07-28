param name string
param location string
param logAnalyticsId string
param storageAccountDiagId string
param tenantId string

param enabledForDeployment bool = false // Azure Virtual Machines（展開用）
param enabledForTemplateDeployment bool = false // Azure Resouce Manager（テンプレートの展開用）
param enabledForDiskEncryption bool = false // Azure Disk Encryption（ボリューム暗号化用）
param enableRbacAuthorization bool = false // アクセス許可モデル
param softDeleteRetentionInDays int = 90 // 論理削除保護日数
// param enablePurgeProtection bool = true // 消去保護
param accessPolicies array = []

resource keyVault 'Microsoft.KeyVault/vaults@2019-09-01' = {
  name: name
  location: location
  properties: {
    tenantId: tenantId
    sku: {
      name: 'standard'
      family: 'A'
    }
    enabledForDeployment: enabledForDeployment
    enabledForDiskEncryption: enabledForDiskEncryption
    enabledForTemplateDeployment: enabledForTemplateDeployment
    softDeleteRetentionInDays: softDeleteRetentionInDays
    enableRbacAuthorization: enableRbacAuthorization
    // enablePurgeProtection: enablePurgeProtection
    accessPolicies: accessPolicies
    // networkAcls: {
    //   bypass: 'AzureServices'
    //   defaultAction: 'Allow'
    //   ipRules: []
    //   virtualNetworkRules: []
    // }
  }
}

resource keyVault_diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-${name}'
  scope: keyVault
  properties: {
    workspaceId: logAnalyticsId
    storageAccountId: empty(storageAccountDiagId) ? null : storageAccountDiagId
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

output id string = keyVault.id
