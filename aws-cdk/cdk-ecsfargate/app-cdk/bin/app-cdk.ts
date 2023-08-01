#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppCdkStack } from '../lib/app-cdk-stack';
import { PipelineCdkStack } from '../lib/pipeline-cdk-stack';
import { EcrCdkStack } from '../lib/ecr-cdk-stack';


const app = new cdk.App();

const projectName = app.node.tryGetContext('projectName');
const stageName = app.node.tryGetContext('stageName');
const githubOwnerName = app.node.tryGetContext('githubOwnerName');
const githubRepositoryName = app.node.tryGetContext('githubRepositoryName');
const githubBranchName = app.node.tryGetContext('githubBranchName');
const codestarConnectionArn = app.node.tryGetContext('codestarConnectionArn');

const ecrCdkStack = new EcrCdkStack(app, 'ecr-stack', {});

//テスト環境を作成する
const testAppCdkStack = new AppCdkStack(app, 'test', { 
  ecrRepository: ecrCdkStack.repository,
});

//本番環境を作成する
const prodAppCdkStack = new AppCdkStack(app, 'prod', {
  ecrRepository: ecrCdkStack.repository,
});

//パイプラインを作成する
const pipelineCdkStack = new PipelineCdkStack(app, 'PipelineCdkStack', {
  projectName,
  stageName,
  githubOwnerName,
  githubRepositoryName,
  githubBranchName,
  codestarConnectionArn,
  ecrRepository: ecrCdkStack.repository,
  testAppFargateService: testAppCdkStack.fargateService,
  prodAppFargateService: prodAppCdkStack.fargateService,
});