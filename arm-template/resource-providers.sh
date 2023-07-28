#!/bin/bash

resourceProviders=(
  "Microsoft.AlertsManagement"
  "Microsoft.Cache"
  "Microsoft.ChangeAnalysis"
  "Microsoft.ContainerRegistry"
  "Microsoft.DBforMySQL"
  "Microsoft.DocumentDB"
  "Microsoft.Insights"
  "Microsoft.KeyVault"
  "Microsoft.Logic"
  "Microsoft.Network"
  "Microsoft.OperationalInsights"
  "Microsoft.Storage"
  "Microsoft.Web"
)

for provider in ${resourceProviders[@]}; do
  az provider register --namespace $provider
done

# Provider の登録状況を確認したい場合に使う
#for provider in ${resourceProviders[@]}; do
#  az provider show --namespace $provider --query "{namespace: namespace, registrationState: registrationState}"
#done
