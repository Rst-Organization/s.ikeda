#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { NetworkStack } from "../lib/NetworkStack";
import { CognitoStack } from "../lib/CognitoStack";
import { DataBaseStack } from "../lib/DataBaseStack";
import { LambdaStack } from "../lib/LambdaStack";
import { DynamoStack } from "../lib/DynamoStack";
import { ApiGatewayStack } from "../lib/ApiGatewayStack";
import { CloudfrontStack } from "../lib/CloudFrontStack";
import { ResourceAccessManagerStack } from "../lib/RamStack";
import { RouteTableModifyStack } from "../lib/RouteTableModifyStack";


const app = new cdk.App();

//cdk.jsonのContextより取得
const PROJECT_NAME = app.node.tryGetContext("projectName"); //PjName
const DEPLOYMENT_STAGE = app.node.tryGetContext("deploymentStage");
const DEPLOY_ACCOUNT = app.node.tryGetContext("deployAccount"); //MyAccount
const DEFAULT_REGION = app.node.tryGetContext("defaultRegion");
const TARGET_AWSACCOUNT:string[] = app.node.tryGetContext("targetAwsAccount"); //TargetAccount
const TARGET_CIDRBLOCKS:string[] = app.node.tryGetContext("targetCidrBlocks"); //Tgwと接続するCIDR


//VPC & SecurityGroup & TransitGateway Stack
const NetworkCdkStack = new NetworkStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-NetworkStack`, {
  deploymentStage: DEPLOYMENT_STAGE,
  env: {
    account: DEPLOY_ACCOUNT,
    region: DEFAULT_REGION,
  },
  description: "This stack creates a VPC, SecurityGroup, and TransitGateway.",
});


//RDS(Oracle) Stack ※RDS for Oracleとその認証情報をSecretManagerへ保存
const DataBaseCdkStack = new DataBaseStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-DatabaseStack`, {
  deploymentStage: DEPLOYMENT_STAGE,
  env: {
    account: DEPLOY_ACCOUNT,
    region: DEFAULT_REGION,
  },
  description: "This stack creates a RDS for Oracle and its authentication information is saved to SecretManager.",
});


//Lambda for zip Deploy Stack ※計4つのLambdaをデプロイする
const LambdaCdkStack = new LambdaStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-LambdaStack`, { 
  deploymentStage: DEPLOYMENT_STAGE,
  CustomLyerArn: "arn:aws:lambda:ap-northeast-1:186208509235:layer:rds-orcl-lyer:1",
  env: {
    account: DEPLOY_ACCOUNT,
    region: DEFAULT_REGION,
  },
  description: "This stack creates a Lambda.",
});


//Cognito Stack ※Cognitoをプロビジョニングする
const CognitoCdkStack = new CognitoStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-CognitoStack`, {
  deploymentStage: DEPLOYMENT_STAGE,
  env: {
    account: DEPLOY_ACCOUNT,
    region: DEFAULT_REGION,
  },
  description: "This stack creates a Cognito.",
});

//DynamoDB Stack ※DynamoDBをプロビジョニングする
const DynamoDbCdkStack = new DynamoStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-DynamoDbStack`, {
  deploymentStage: DEPLOYMENT_STAGE,
  projectName: PROJECT_NAME,
  env: {
    account: DEPLOY_ACCOUNT,
    region: DEFAULT_REGION,
  },
  description: "This stack creates a DynamoDB.",
});

//API Gateway Stack ※Lambda統合 & CognitoAuthorizer & DynamoDB統合
const ApiGatewayCdkStack = new ApiGatewayStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-ApigatewayStack`, {
  deploymentStage: DEPLOYMENT_STAGE,
  env: {
    account: DEPLOY_ACCOUNT,
    region: DEFAULT_REGION,
  },
  description: "This stack creates a API Gateway.",
});

//CloudFront Stack ※CloudFrontとAPIGatewayをアタッチ
const CloudFrontCdkStack = new CloudfrontStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-CloudFrontstack`, {
  deploymentStage: DEPLOYMENT_STAGE,
  restApi: ApiGatewayCdkStack.restApi,
  env: {
    account: DEPLOY_ACCOUNT,
    region: DEFAULT_REGION,
  },
  description: "This stack creates a CloudFront.",
});


//Resource Access Manager Stack ※RAMを使用して別アカウントへTransitGwリソースを共有する
const RamCdkStack = new ResourceAccessManagerStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-RamStack`, {
  deploymentStage: DEPLOYMENT_STAGE,
  TargetAwsAccount: TARGET_AWSACCOUNT,
  env: {
    account: DEPLOY_ACCOUNT,
    region: DEFAULT_REGION,
  },
  description: "This stack shares the TransitGateway to another account in the Resource Access Manager.",
});

// Route Table Modify Stack ※共通基盤から別アカウントアプリへのルーティングを追加する
const RouteTableModifyCdkStack = new RouteTableModifyStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-RouteModifyStack`, {
  deploymentStage: DEPLOYMENT_STAGE,
  targetCidrBlocks: TARGET_CIDRBLOCKS,
  env: {
    account: DEPLOY_ACCOUNT,
    region: DEFAULT_REGION,
  },
  description: "This stack adds routing from the common infrastructure to the application in another account.",
});
