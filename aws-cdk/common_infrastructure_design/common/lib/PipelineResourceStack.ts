import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';

import createArtifactBucket from './resource/createArtifactBucket';
import createArtifactKey from './resource/createArtifactKey';
import createCodeBuildRole from './resource/createCodeBuildRole';
import createCodePipelineRole from './resource/createCodePipelineRole';

interface PipelineResourceStackProps extends StackProps {
  devopsAccountId: string;
  deploymentStage: string;
}

export class PipelineResourceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: PipelineResourceStackProps) {
      super(scope, id, props);
  
      const DEVOPS_ACCOUNT_ID = props.devopsAccountId;
      const DEPLOYMENT_STAGE = props.deploymentStage;
      
      //CodePipeLineを実行する為のロールを作成(DEV_OPSのアカウントのAssumRole)
      const codePipelineServiceRole = createCodePipelineRole(this, DEVOPS_ACCOUNT_ID, DEPLOYMENT_STAGE);
      //CodeBildを実行する為のロールを作成
      const codeBuildServiceRole = createCodeBuildRole(this, DEPLOYMENT_STAGE)
      //KMSを作成
      const artifactEncryptKey = createArtifactKey(this, DEVOPS_ACCOUNT_ID, codePipelineServiceRole, codeBuildServiceRole);
      //アーティファクトバケットを作成
      const artifactBucketArn = createArtifactBucket(this, DEPLOYMENT_STAGE, DEVOPS_ACCOUNT_ID, artifactEncryptKey);

    };
  }