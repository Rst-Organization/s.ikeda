#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppCdkStack } from '../lib/app-cdk-stack';
import { PipelineCdkStack } from '../lib/pipeline-cdk-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('projectName');
const stageName = app.node.tryGetContext('stageName');
const githubOwnerName = app.node.tryGetContext('githubOwnerName');
const githubRepositoryName = app.node.tryGetContext('githubRepositoryName');
const githubBranchName = app.node.tryGetContext('githubRepositoryName');
const codestarConnectionArn = app.node.tryGetContext('codestarConnectionArn');

new AppCdkStack(app, 'AppCdkStack', {});
new PipelineCdkStack(app, 'PipelineCdkStack', {
  projectName,
  stageName,
  githubOwnerName,
  githubRepositoryName,
  githubBranchName,
  codestarConnectionArn,
});