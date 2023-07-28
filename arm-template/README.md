# 博報堂

```sh
az account set -s <Subscription ID>
az account show -o table
```

## 環境共通

- Resource Group Name
  - `rg-<Application Prefix Name>-shared`

```sh
az group create --location <Location> --name <Resource Group Name>
```

```sh
az deployment group create --resource-group <Resource Group Name> --template-file shared.bicep --parameters shared.parameters.json --confirm-with-what-if
```

## 環境毎

- Resource Group Name
  - `rg-<Application Prefix Name>-[prod/stg/stress]`

```sh
az group create --location <Location> --name <Resource Group Name>
```

```sh
az deployment group create --resource-group <Resource Group Name> --template-file main.bicep --parameters main.parameters.json --confirm-with-what-if
```

```sh
az deployment group create --resource-group <Resource Group Name> --template-file frontDoorRuleEngine.bicep --parameters frontDoorRuleEngine.parameters.json --confirm-with-what-if
```
  - RuleEngine作成後、ルーティング規則へそれぞれ設定する
    - ruleEngineBlob - routingRule-Blob
    - ruleEngineCatchAllRoot - routingRule-CatchAllRoot
    - ruleEngineRoot - routingRule-Root

## DNS環境
- Resource Group Name
  - `rg-<Application Prefix Name>-dns`

```sh
az group create --location <Location> --name <Resource Group Name>
```

```sh
az deployment group create --resource-group <Resource Group Name> --template-file dns.bicep --parameters dns.parameters.json --confirm-with-what-if
```

### カスタムドメイン

- KeyVaultのSSL証明書を利用する
  - App Service <https://docs.microsoft.com/ja-jp/azure/app-service/configure-ssl-certificate#authorize-app-service-to-read-from-the-vault>
  - Front Door <https://docs.microsoft.com/ja-jp/azure/frontdoor/front-door-custom-domain-https#option-2-use-your-own-certificate>
