#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MyErcStack } from '../lib/EcrStack';
import { VpcStack } from '../lib/VpcStack';
import { AppBaseStack } from '../lib/AppBaseStack';
import { TransitGatewayAttachmentStack } from '../lib/TransitGwAttachmentStack';
import { PipelineResourceStack } from '../lib/PipelineResourceStack';
import { PipelineStack } from '../lib/PipelineStack';


const app = new cdk.App();

//cdk.jsonのContextより取得
const PROJECT_NAME = app.node.tryGetContext('projectName');
const DEPLOYMENT_STAGE = app.node.tryGetContext('deploymentStage');
const TRANSIT_GW_ID = app.node.tryGetContext('transitGwId');
const TGW_ROUTE_IP = app.node.tryGetContext('tgwRouteIp');
const DEPLOY_ACCOUNT = app.node.tryGetContext('deployAccount');
const DEVOPS_ACCOUNT = app.node.tryGetContext('devOpsAccount');
const DEPLOY_REGION = app.node.tryGetContext('deployRegion');

//Create ECR Repository
const EcrCdkStack = new MyErcStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-EcrStack`, {
    deploymentStage: DEPLOYMENT_STAGE,
    projectName: PROJECT_NAME,
    env: {
        account: DEPLOY_ACCOUNT,
        region: DEPLOY_REGION,
    },
    description: `This Stack is Create ${DEPLOYMENT_STAGE}-ECR Repository for ECS Fargate`
});

//Create VPC and Security Group
const VpcCdkStack = new VpcStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-VpcStack`, {
    deploymentStage: DEPLOYMENT_STAGE,
    projectName: PROJECT_NAME,
    env: {
        account: DEPLOY_ACCOUNT,
        region: DEPLOY_REGION,
    },
    description: `This Stack is Create ${DEPLOYMENT_STAGE}-VPC`
});

//Create Database and ECS Fargate Service and ALB
const AppBaseCdkStack = new AppBaseStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-AppBaseStack`, {
    deploymentStage: DEPLOYMENT_STAGE,
    projectName: PROJECT_NAME,
    ecrRepositoryArn: EcrCdkStack.EcrRepositoryArn, //ECRのリポジトリARN
    env: {
        account: DEPLOY_ACCOUNT,
        region: DEPLOY_REGION,
    },
    description: `This Stack is Create ${DEPLOYMENT_STAGE}-Database with ECS FargateService and ALB`
});

//Create Transit Gateway Attachment
const TransitGatewayAttachmentCdkStack = new TransitGatewayAttachmentStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-TgwAttachmentStack`, {
    deploymentStage: DEPLOYMENT_STAGE,
    projectName: PROJECT_NAME,
    tgwId: TRANSIT_GW_ID,
    routeIp: TGW_ROUTE_IP,
    env: {
        account: DEPLOY_ACCOUNT,
        region: DEPLOY_REGION,
    },
    description: `This Stack is Create ${DEPLOYMENT_STAGE}-Transit Gateway Attachment`
});

//Create CodePipelineResource
const PipelineResourceCdkStack = new PipelineResourceStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-PipelineResourceStack`, {
    devopsAccountId: DEVOPS_ACCOUNT,
    deploymentStage: DEPLOYMENT_STAGE,
    env: {
        account: DEPLOY_ACCOUNT,
        region: DEPLOY_REGION,
    },
    description: `This Stack is Create ${DEPLOYMENT_STAGE}-Resources required for CodePipeline`
});

//Create CodePipeline ※以下各ARNを実際に構築したリソースのARNに変更すること
const PipelineCdkStack = new PipelineStack(app, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-PipelineStack`, {
    devopsAccountId: DEVOPS_ACCOUNT,
    deploymentStage: DEPLOYMENT_STAGE,
    projectName: PROJECT_NAME,
    ecrRepositoryUri: "967185805673.dkr.ecr.ap-northeast-1.amazonaws.com/prod-app-repo",
    FargateService: AppBaseCdkStack.fargateService,
    targetBranch: "main",
    artifactBucketArn: "arn:aws:s3:::prod-artifact-bucket-uodl1v",
    artifactEncryptKeyArn: "arn:aws:kms:ap-northeast-1:967185805673:key/3fe09446-bbbc-471c-a8cb-f189fd4fc938",
    codeBuildServiceRoleArn: "arn:aws:iam::967185805673:role/prod-codebuild-service-role",
    codePipelineServiceRoleArn: "arn:aws:iam::967185805673:role/prod-codepipeline-service-role",
    codeCommitRepositoryArn: "arn:aws:codecommit:ap-northeast-1:216019509931:stadiumapp-common-rep", //CodeCommitのリポジトリARN
    codeCommitAccessRoleArn: "arn:aws:iam::216019509931:role/stadiumapp-common-codepipeline-codecommit-role", // devops/AssumeRoleStackで作成したロールARN
    env: {
        account: DEPLOY_ACCOUNT,
        region: DEPLOY_REGION,
    },
    description: `This Stack is Create ${DEPLOYMENT_STAGE}-CodePipeline`
});

