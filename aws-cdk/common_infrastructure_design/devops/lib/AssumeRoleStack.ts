import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { CfnOutput, StackProps } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

interface AssumeRoleStackProps extends StackProps {
  projectName: string;
  envAccountIds: string[];
  artifactBucketArns: string[];
  artifactEnCryptKeyArns: string[];
  codeCommitRepoArn: string;
}

export class AssumeRoleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AssumeRoleStackProps) {
    super(scope, id, props);

    const envAccountIds:string[] = props.envAccountIds;
    const principals = envAccountIds.map(envAccountId => new iam.ArnPrincipal(`arn:aws:iam::${envAccountId}:root`));
    const artifactBucketArns:string[] = props.artifactBucketArns;
    const artifactCryptKeyArns:string[] = props.artifactEnCryptKeyArns;
    const codeCommitRepoArn = props.codeCommitRepoArn;

    // IAM Role
    const codepipelineCodecommitRole = new iam.Role(this, 'CodePipelineCodeCommitRole', {
      roleName: `${props.projectName}-codepipeline-codecommit-role`,
      assumedBy: new iam.CompositePrincipal(...principals),
      inlinePolicies: {
        'inlinepolicy': new iam.PolicyDocument({
          statements: [
            ...[new iam.PolicyStatement({
              sid: 'UploadArtifactPolicy',
              actions: ['s3:Get*', 's3:Put*'],
              resources: artifactBucketArns.map(artifactBucketArn => `${artifactBucketArn}/*`),
            })],
            ...[new iam.PolicyStatement({
              sid: 'S3ListBucketPolicy',
              actions: ['s3:ListBucket'],
              resources: artifactBucketArns,
            })],
            ...[new iam.PolicyStatement({
              sid: 'KMSAccessPolicy',
              actions: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*'
              ],
              resources: artifactCryptKeyArns,
            })],
            new iam.PolicyStatement({
              sid: 'CodeCommitAccessPolicy',
              actions: [
                'codecommit:GetBranch',
                'codecommit:GetCommit',
                'codecommit:UploadArchive',
                'codecommit:GetUploadArchiveStatus',
                'codecommit:CancelUploadArchive',
                'codecommit:GetRepository'
              ],
              resources: [codeCommitRepoArn],
            }),
          ],
        }),
      },
    });
  
    new CfnOutput(this, 'codeCommitAccessRoleArn', {
      value: codepipelineCodecommitRole.roleArn,
    });

  }
}