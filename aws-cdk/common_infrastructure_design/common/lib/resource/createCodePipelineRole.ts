import {Stack, CfnOutput} from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * CodePipelineのサービスロール作成
 * @param stack
 * @param sourceAccountId CodeCommitのリポジトリを所有しているアカウントID
 * @param deploymentStage string
 * @returns iam.Role
 */
const createCodePipelineRole = (stack: Stack, sourceAccountId: string, deploymentStage: string): iam.Role => {
    const role = new iam.Role(stack, `CodePipelineServiceRole`, {
        roleName: `${deploymentStage}-codepipeline-service-role`,
        // CodePipelineからAssumeRoleされる
        assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
        inlinePolicies: {
            thing: new iam.PolicyDocument({
                statements: [
                    // CodeCommitリポジトリを保有しているアカウントのロールにAssumeRoleを行う権限
                    new iam.PolicyStatement({
                        sid: 'AssumeRolePolicy',
                        actions: ['sts:AssumeRole'],
                        resources: [`arn:aws:iam::${sourceAccountId}:role/*`],
                    }),
                    new iam.PolicyStatement({
                        sid: 'S3Policy',
                        actions: [
                            's3:PutObject',
                            's3:GetObject',
                            's3:GetObjectVersion',
                            's3:GetBucketVersioning'
                        ],
                        resources: ['*']                        
                    }),
                    new iam.PolicyStatement({
                        sid: 'CodeBuildPolicy',
                        actions: [
                            'codebuild:BatchGetBuilds',
                            'codebuild:StartBuild'
                        ],
                        resources: ['*']
                    }),
                ],
            }),
        }
    });
    new CfnOutput(stack, 'CodePipelineServiceRoleArn', {
        value: role.roleArn,
    });
    return role;
}

export default createCodePipelineRole;