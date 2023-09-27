import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { CfnOutput, StackProps } from 'aws-cdk-lib';


interface CodeCommitStackProps extends StackProps {
  projectName: string;
  repositoryName: string
}

export class CodeCommitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CodeCommitStackProps) {
    super(scope, id, props);

    //CodeCommit Repository
    const sourceRepo = new codecommit.Repository(this, `${props.projectName}-codeCommitStack`, {
      repositoryName: props.repositoryName,
      description: `Repository for ${props.repositoryName} code and infrastructure`,
    });

    new CfnOutput(this, 'sourceRepoArn', {
      value: sourceRepo.repositoryArn,
    });
    
  }
}