import * as cdk from 'aws-cdk-lib';
import { Stack, CfnOutput } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';

/**
 * アーティファクト用のKMS Keyを作成
 * @param stack construct
 * @param devopsAccountId CodeCommitのリポジトリを所有しているアカウントID
 * @param codePipelineServiceRole CodePipelineのサービスロール
 * @param codeBuildServiceRole CodeBuildのサービスロール
 * @returns kms.Key
 */
const createArtifactKey = (
    stack: Stack, 
    devopsAccountId: string, 
    codePipelineServiceRole: iam.Role, 
    codeBuildServiceRole: iam.Role): kms.Key => {

    const cryptKey = new kms.Key(stack, 'ArtifactCryptKey', {
        alias: `${Stack.of(stack).stackName}-artifact-crypt-key`,
        description: `${Stack.of(stack).stackName}-ArtifactCryptKey`,
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 現アカウントからの操作権限
    cryptKey.addToResourcePolicy(new iam.PolicyStatement({
        sid: 'Enable IAM User Permissions',
        effect: iam.Effect.ALLOW,
        principals: [
            new iam.ArnPrincipal(
                `arn:aws:iam::${Stack.of(stack).account}:root`,
            )
        ],
        actions: ['kms:*'],
        resources: ['*']
    }));

    // CI/CDの各ステージ + Devopsアカウントからの操作権限
    cryptKey.addToResourcePolicy(new iam.PolicyStatement({
        sid: 'Allow use of the key',
        effect: iam.Effect.ALLOW,
        principals: [
            new iam.ArnPrincipal(codePipelineServiceRole.roleArn),
            new iam.ArnPrincipal(codeBuildServiceRole.roleArn),
            new iam.ArnPrincipal(`arn:aws:iam::${devopsAccountId}:root`)
        ],
        actions: [
            "kms:Encrypt",
            "kms:Decrypt",
            "kms:ReEncrypt*",
            "kms:GenerateDataKey*",
            "kms:DescribeKey"
        ],
        resources: ['*']
    }));
    cryptKey.addToResourcePolicy(new iam.PolicyStatement({
        sid: 'Allow attachment of persistent resources',
        effect: iam.Effect.ALLOW,
        principals: [
            new iam.ArnPrincipal(codePipelineServiceRole.roleArn),
            new iam.ArnPrincipal(codeBuildServiceRole.roleArn),
            new iam.ArnPrincipal(`arn:aws:iam::${devopsAccountId}:root`)
        ],
        actions: [
            "kms:CreateGrant",
            "kms:ListGrants",
            "kms:RevokeGrant"
        ],
        resources: ['*'],
        conditions: {
            Bool: {
                'kms:GrantIsForAWSResource': true
            }
        }
    }));
    new CfnOutput(stack, `ArtifactEncryptKeyArn`, {
        value: cryptKey.keyArn,
    });

    return cryptKey;
}

export default createArtifactKey;