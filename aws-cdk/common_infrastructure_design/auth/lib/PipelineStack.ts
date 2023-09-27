import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as codecommit from "aws-cdk-lib/aws-codecommit";
import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as iam from "aws-cdk-lib/aws-iam";

interface PipelineProps extends StackProps {
  deploymentStage: string;
}


export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineProps) {
    super(scope, id, props);

    const DEPLOYMENT_STAGE = props?.deploymentStage || "stg";

    //CodeCommit Repository
    const sourceRepo = new codecommit.Repository(this, "Repository", {
      repositoryName: `${DEPLOYMENT_STAGE}-Repository`,
      description: "Repository for LambdaSrcCode and infrastructureCode",
    });

    //CodeBuild用のIAMロールを作成
    const codeBuildRole = new iam.Role(this, "CodeBuildServiceRole", {
      assumedBy: new iam.ServicePrincipal("codebuild.amazonaws.com"),
      path: "/",
      inlinePolicies: {
        codeBuildServicePolicies: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["cloudformation:*"],
              resources: ["*",],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["ssm:GetParameter"],
              resources: ["*",],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["s3:*"],
              resources: ["*",],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['iam:PassRole'],
              resources: ["*",],
            }),
          ],
        }),
      },
    });

    //CodePipeLine
    const BuildDeployProject = new codebuild.PipelineProject(this, 'BuildDeployProject', {
      projectName: `${DEPLOYMENT_STAGE}-BuildProject`,
      //buildspec_docker.ymlを参照するように設定
      buildSpec: codebuild.BuildSpec.fromSourceFilename("./common/buildspec.yaml"),
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: true, //Dockerイメージをビルドするために特権が必要
        environmentVariables: {
          STAGE_NAME: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: DEPLOYMENT_STAGE,
          },
        },
      },
    });
    
    const sourceArtifact = new codepipeline.Artifact();

    //CodeCommitからのソースコードの取得のステージとアクションを追加 ※mainブランチにマージでアクション発火
    const sourceAction = new codepipeline_actions.CodeCommitSourceAction({
      actionName: "CodeCommit",
      repository: sourceRepo,
      output: sourceArtifact,
      branch: "main",
    });

    //Lambdaへのデプロイのステージとアクションを追加
    const deployAction = new codepipeline_actions.CodeBuildAction({
      actionName: "deploy",
      project: BuildDeployProject,
      input: sourceArtifact,
    });
    

    //パイプラインの作成
    new codepipeline.Pipeline(this, "LambdaDeployPipeline", {
      pipelineName: `${id}-Pipeline`,
      stages: [
        {
          stageName: "Source",
          actions: [sourceAction],
        },
        {
          stageName: "Deploy",
          actions: [deployAction],
        },
      ],
    });

    //CodeCommitのリポジトリのURLを出力
    new CfnOutput(this, 'CodeCommitRepositoryCloneUrlHttp', {
      value: sourceRepo.repositoryCloneUrlHttp,
    });

  };
}