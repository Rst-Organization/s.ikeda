import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import { CodePipeline } from "aws-cdk-lib/pipelines";
import * as codePipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';

export interface CicdStackProps extends StackProps {
    projectName: string;
    stageName: string;
    githubOwnerName: string;
    githubRepositoryName: string;
    githubBranchName: string;
    codestarConnectionArn: string;
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




  }
}
