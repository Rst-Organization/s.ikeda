#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdaOracleStack } from '../lib/LambdaOracleStack';
import { MyErcStack } from '../lib/EcrStack';
import { PipelineStack } from '../lib/PipelineStack';
import { LambdaRdsStack } from '../lib/LambdaRdsStack';
import { EcsFargateStack } from '../lib/EcsFargateStack';

const app = new cdk.App();

//cdk.jsonのContextより取得
const PROJECT_NAME = app.node.tryGetContext('projectName');
const DEPLOYMENT_STAGE = app.node.tryGetContext('deploymentStage');

//ECR Stack
const ErcCdkStack = new MyErcStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-EcrStack`, {});

//CodeCommit CodePipeline Stack
const PipelineCdkStack = new PipelineStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-PipelineStack`, {
  ecrRepository: ErcCdkStack.lambdaEcrRepository,
});

//Lambda & RDS(Oracle) for zip Deploy Stack
const LambdaOracleCdkStack = new LambdaOracleStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-LambdaOracleStack`, { 
  deploymentStage: DEPLOYMENT_STAGE,
});

//Lambda & RDS(MySql) for zip Deploy Stack
const LambdaCdkStack = new LambdaRdsStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-LambdaRdsStack`, {
  deploymentStage: DEPLOYMENT_STAGE,
});

//ECS FarGate Stack
const EcsFargateCdkStack = new EcsFargateStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-EcsFargateStack`, {
  deploymentStage: DEPLOYMENT_STAGE,
  ecrRepository: ErcCdkStack.lambdaEcrRepository,
});