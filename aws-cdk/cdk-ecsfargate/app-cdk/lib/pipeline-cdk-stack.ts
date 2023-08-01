import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import { CodePipeline } from "aws-cdk-lib/pipelines";
import * as codePipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';

export interface CicdStackProps extends StackProps {
    projectName: string;
    stageName: string;
    githubOwnerName: string;
    githubRepositoryName: string;
    githubBranchName: string;
    codestarConnectionArn: string;
    ecrRepository: ecr.Repository;
    testAppFargateService: ecsPatterns.ApplicationLoadBalancedFargateService;
    prodAppFargateService: ecsPatterns.ApplicationLoadBalancedFargateService;
  }

export class PipelineCdkStack extends Stack {
  constructor(scope: Construct, id: string, props: CicdStackProps) {
    super(scope, id, props);

    const { projectName, stageName, githubOwnerName, githubRepositoryName, githubBranchName, codestarConnectionArn } = props;

    const pipeline = new codepipeline.Pipeline(this, "CICD_Pipeline", {
      pipelineName: "CICD_Pipeline",
      crossAccountKeys: false,
    });

    const codeQualityBuild = new codebuild.PipelineProject(
        this,
        "Code Quality",
        {
          environment: {
            buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
            privileged: true,
            computeType: codebuild.ComputeType.LARGE
          },
          buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec_test.yml')
        }
      );

    
    const dockerBuildProject = new codebuild.PipelineProject(
        this,
        "DockerBuildProject",
        {
          environmentVariables: {
            IMAGE_TAG: { value: "latest" },
            IMAGE_REPO_URI: { value: props.ecrRepository.repositoryUri },
            AWS_DEFAULT_REGION: { value: process.env.CDK_DEFAULT_REGION },
          },
          environment: {
            buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
            privileged: true,
            computeType: codebuild.ComputeType.LARGE
          },
          buildSpec: codebuild.BuildSpec.fromSourceFilename(
            "buildspec_docker.yml"
          ),
        }
      );
    
    const dockerBuildRolePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ["*"],
      actions: [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:GetRepositoryPolicy",
        "ecr:DescribeRepositories",
        "ecr:ListImages",
        "ecr:DescribeImages",
        "ecr:BatchGetImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage",
      ],
    });

    dockerBuildProject.addToRolePolicy(dockerBuildRolePolicy);

    //GitHubからソースを取得する
    const sourceOutput = new codepipeline.Artifact();
    pipeline.addStage({
        stageName: "Source",
        actions: [
          new codePipelineActions.CodeStarConnectionsSourceAction({
              actionName: 'source',
              owner: githubOwnerName,
              repo: githubRepositoryName,
              branch: githubBranchName,
              connectionArn: codestarConnectionArn,
              output: sourceOutput,
            }),
        ],
      });

    const unitTestOutput = new codepipeline.Artifact();
    pipeline.addStage({
      stageName: "Code-Quality-Testing",
      actions: [
        new codePipelineActions.CodeBuildAction({
          actionName: "Unit-Test",
          project: codeQualityBuild,
          input: sourceOutput,
          outputs: [unitTestOutput],
        }),
      ],
    });

    const dockerBuildOutput = new codepipeline.Artifact();
    pipeline.addStage({
      stageName: "Docker-Push-ECR",
      actions: [
        new codePipelineActions.CodeBuildAction({
          actionName: "docker-build",
          project: dockerBuildProject,
          input: sourceOutput,
          outputs: [dockerBuildOutput],
        }),
      ],
    });

    pipeline.addStage({
      stageName: "Deploy-Test",
      actions: [
        new codePipelineActions.EcsDeployAction({
          actionName: "deployECS",
          service: props.testAppFargateService.service,
          input: dockerBuildOutput,
        }),
      ],
    });

    pipeline.addStage({
      stageName: 'Deploy-Production',
      actions: [
        new codePipelineActions.ManualApprovalAction({
          actionName: 'Approve-Prod-Deploy',
          runOrder: 1
        }),
        new codePipelineActions.EcsDeployAction({
          actionName: 'deployECS',
          service: props.prodAppFargateService.service,
          input: dockerBuildOutput,
          runOrder: 2
        })
      ]
    });





  };
}
