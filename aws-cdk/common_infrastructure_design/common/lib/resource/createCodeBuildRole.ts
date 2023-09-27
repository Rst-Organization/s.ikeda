import {Stack, CfnOutput} from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * CodeBuildのサービスロール作成
 * @param stack construct
 * @param deploymentStage string
 * @returns iam.Role
 */
const createCodeBuildRole = (stack: Stack, deploymentStage: string): iam.Role => {
    const role = new iam.Role(stack, `CodeBuildServiceRole`, {
        roleName: `${deploymentStage}-codebuild-service-role`,
        assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
        inlinePolicies: {
            thing: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        sid: 'CloudWatchLogsPolicy',
                        actions: [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        resources: ['*'],
                    }),
                    new iam.PolicyStatement({
                        sid: 'S3ObjectPolicy',
                        actions: [
                            "s3:PutObject",
                            "s3:GetObject",
                            "s3:GetObjectVersion"
                        ],
                        resources: ['*'],
                    }),
                    new iam.PolicyStatement({
                        sid: 'ECRPolicy',
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
                            "ecr:PutImage"
                        ],
                        resources: ['*'],
                    }),
                    new iam.PolicyStatement({
                        sid: 'ssmReadOnlyAccess',
                        actions: [
                            "ssm:GetParameters",
                            "ssm:GetParameter"
                        ],
                        resources: ['*'],
                    }),
                ],
            }),
        }
    });
    new CfnOutput(stack, 'CodeBuildServiceRoleArn', {
        value: role.roleArn,
    });
    return role;
}

export default createCodeBuildRole;