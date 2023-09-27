import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CodeCommitStack } from '../lib/CodeCommitStack';
import { AssumeRoleStack } from '../lib/AssumeRoleStack';
import { EventBridgeStack } from '../lib/EventBridgeStack';

const app = new cdk.App();

const PROJECT_NAME = app.node.tryGetContext('projectName');
const DEVOPS_ACCOUNT = app.node.tryGetContext('devOpsAccount');
const DEPLOY_REGION = app.node.tryGetContext('deployRegion');

//以下の環境変数を実際の値に変更する
const env = {
     //デプロイパイプラインがあるAWSアカウント
    envAccountIds: ["886648657104","967185805673"],
     //パイプラインがあるアカウントのアーティファクトバケットARN
    artifactBucketArns: ["arn:aws:s3:::stg-artifact-bucket-68psj4","arn:aws:s3:::prod-artifact-bucket-uodl1v"],
     //デプロイ先アカウントのアーティファクトバケットの暗号化キーARN
    artifactEnCryptKeyArns: ["arn:aws:kms:ap-northeast-1:886648657104:key/309e9fb7-0e9e-4b29-bcff-5cc3ab8035c7","arn:aws:kms:ap-northeast-1:967185805673:key/3fe09446-bbbc-471c-a8cb-f189fd4fc938"],
     //CodeCommitのリポジトリARN
    codeCommitRepoArn: "arn:aws:codecommit:ap-northeast-1:216019509931:stadiumapp-common-rep",
}

//コードコミットのリポジトリを作成
const CodeCommitCdkStack = new CodeCommitStack(app, `${PROJECT_NAME}-CodeCommitStack`, {
    projectName: PROJECT_NAME,
    repositoryName: "stadiumapp-common-rep",
    env: {
        account: DEVOPS_ACCOUNT,
        region: DEPLOY_REGION,
    }
});

//別のアカウントからのアクセスを許可するIAMロールを作成
const AssumeRoleCdkStack = new AssumeRoleStack(app, `${PROJECT_NAME}-AssumeRoleStack`, {
    projectName: PROJECT_NAME,
    envAccountIds: env.envAccountIds,
    artifactBucketArns: env.artifactBucketArns,
    artifactEnCryptKeyArns: env.artifactEnCryptKeyArns,
    codeCommitRepoArn: env.codeCommitRepoArn,
    env: {
        account: DEVOPS_ACCOUNT,
        region: DEPLOY_REGION,
    }
});

//EventBridge(ステージング環境へのトリガー)作成
const EventBridgeCdkStack = new EventBridgeStack(app, `${PROJECT_NAME}-stg-EventBridgeStack`, {
    projectName: PROJECT_NAME,
    codeCommitRepoArn: env.codeCommitRepoArn,
    envAccountId: env.envAccountIds[0],
    deployRegion: DEPLOY_REGION,
    targetBranch: "staging",
    env: {
        account: DEVOPS_ACCOUNT,
        region: DEPLOY_REGION,
    }
});

//EventBridge(本番環境へのトリガー)作成
const EventBridgeProdCdkStack = new EventBridgeStack(app, `${PROJECT_NAME}-prod-EventBridgeStack`, {
    projectName: PROJECT_NAME,
    codeCommitRepoArn: env.codeCommitRepoArn,
    envAccountId: env.envAccountIds[1],
    deployRegion: DEPLOY_REGION,
    targetBranch: "main",
    env: {
        account: DEVOPS_ACCOUNT,
        region: DEPLOY_REGION,
    }
});





