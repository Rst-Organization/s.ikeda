import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { StringParameter } from "aws-cdk-lib/aws-ssm";

/**
 * CodePipelineの作成
 * @param stack construct
 * @param deploymentStage string
 * @param projectName string
 * @param ecrRepositoryUri string
 * @param FargateService ecsPatterns.ApplicationLoadBalancedFargateService
 * @param targetBranch string
 * @param artifactBucketArn string
 * @param artifactEncryptKeyArn string
 * @param codeBuildServiceRoleArn string
 * @param codePipelineServiceRoleArn string
 * @param codeCommitRepositoryArn string
 * @param codeCommitAccessRoleArn string
 */

const createPipeline = (
    stack: Stack, 
    deploymentStage: string,
    projectName: string,
    ecrRepositoryUri: string,
    FargateService: ecsPatterns.ApplicationLoadBalancedFargateService,
    targetBranch: string,
    artifactBucketArn: string,
    artifactEncryptKeyArn: string,
    codeBuildServiceRoleArn: string,
    codePipelineServiceRoleArn: string,
    codeCommitRepositoryArn: string,
    codeCommitAccessRoleArn: string,
    ): string => {

    //ソース管理レポジトリを取得
    const repository = codecommit.Repository.fromRepositoryArn(stack, `SourceRepository`, codeCommitRepositoryArn);
    //CodeCommit用のロールを取得
    const codeCommitRole = iam.Role.fromRoleArn(stack, 'CodeCommitRole', codeCommitAccessRoleArn, {
      mutable: false
    });
    //CodeBuild用のロールを取得
    const codeBuildRole = iam.Role.fromRoleArn(stack, 'CodeBuildRole', codeBuildServiceRoleArn);
    //CodePipeline用のロールを取得
    const codePipelineRole = iam.Role.fromRoleArn(stack, 'CodePipelineRole', codePipelineServiceRoleArn);
    // Artifactバケットキーを取得
    const encryptionKey = kms.Key.fromKeyArn(stack, 'EncryptKey', artifactEncryptKeyArn);

    // CodePipelineで使用するArtifactを定義
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const artifactBucket = s3.Bucket.fromBucketAttributes(stack, 'ArtifactBucket', {
      bucketArn: artifactBucketArn,
      encryptionKey,
    });

    // //VPCをパラメータストアから取得(アクションをVPCとアタッチする場合にコメントアウトを外す)
    // const VPC_ID: string = StringParameter.valueFromLookup(stack, `/vpc/${deploymentStage}-${projectName}/VpcId`);
    // const vpc = ec2.Vpc.fromLookup(stack, `${deploymentStage}-${projectName}-CodeBuild-VPC`, {
    //     vpcId: VPC_ID,
    // });


    //CodePipeline
    const pipeline = new codepipeline.Pipeline(stack, `${deploymentStage}-${projectName}-Pipeline`, {
      pipelineName: `${deploymentStage}-${projectName}-Pipeline`,
      role: codePipelineRole,
      artifactBucket,
      crossAccountKeys: true,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeCommitSourceAction({
              actionName: 'CodeCommit',
              repository: repository,
              output: sourceOutput,
              branch: targetBranch,
              role: codeCommitRole,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'BuildAndEcrPush',
              project: new codebuild.PipelineProject(stack, 'DockerBuildProject', {
                projectName: `${deploymentStage}-${projectName}-build-project`,
                environmentVariables: {
                  'IMAGE_TAG': { value: 'latest' },
                  'IMAGE_REPO_URI': {value: ecrRepositoryUri },
                  'AWS_DEFAULT_REGION': {value: process.env.CDK_DEFAULT_REGION },
                  'CONTAINER_NAME' : {value: FargateService.taskDefinition.defaultContainer!.containerName},
                  // 以下は必要であればSSMパラメータストアに格納した値を環境変数に追加する
                  // 'DOCKERHUB_USER' : { value: '/dockerhub/user' , type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE },
                  // 'DOCKERHUB_PASS' : { value: '/dockerhub/pass' , type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE }
                },
                environment: {
                  buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                  privileged: true,
                  computeType: codebuild.ComputeType.LARGE
                },
                buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec_docker.yml'), //ビルド定義ファイル参照
                role: codeBuildRole,
              }),
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.EcsDeployAction({
              actionName: 'DeployToEcs',
              service: FargateService.service,
              input: buildOutput,
              role: codePipelineRole,
            }),
          ],
        },
      ],
      
    });
    
    new CfnOutput(stack, 'CodePipelineArn', {
        value: pipeline.pipelineArn,
        exportName: `${deploymentStage}-${projectName}-CodePipelineArn`,
    });

    return pipeline.pipelineArn;
}

export default createPipeline

