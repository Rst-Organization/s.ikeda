import * as cdk from 'aws-cdk-lib';
import { Stack, CfnOutput } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';

/**
 * アーティファクト用のS3バケットを作成
 * @param stack construct
 * @param deploymentStage string
 * @param devopsAccountId CodeCommitレポジトリがあるアカウントID
 * @param cryptKey アーティファクト用のS3バケットの暗号化キー
 * @returns bucketArn string
 */
const createArtifactBucket = (stack: Stack, deploymentStage: string, devopsAccountId: string, cryptKey: kms.Key):string => {
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    // CodePipelineで使用するアーティファクト用バケットを作成
    const artifactBucket = new s3.Bucket(stack, `BuildArtifactBucket`, {
        bucketName: `${deploymentStage}-artifact-bucket-${randomSuffix}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: cryptKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    artifactBucket.addToResourcePolicy(new iam.PolicyStatement({
        sid: 'DenyUnEncryptedObjectUploads',
        effect: iam.Effect.DENY,
        principals: [new iam.StarPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`arn:aws:s3:::${artifactBucket.bucketName}/*`],
        conditions: {
            StringNotEquals: {
                's3:x-amz-server-side-encryption': 'aws:kms'
            }
        }
    }));
    artifactBucket.addToResourcePolicy(new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.StarPrincipal()],
        actions: ['s3:*'],
        resources: [`arn:aws:s3:::${artifactBucket.bucketName}/*`],
        conditions: {
            Bool: {
                'aws:SecureTransport': false
            }
        }
    }));
    artifactBucket.addToResourcePolicy(new iam.PolicyStatement({
        sid: 'CrossAccountS3GetPutPolicy',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ArnPrincipal(`arn:aws:iam::${devopsAccountId}:root`)],
        actions: [
            's3:Get*',
            's3:Put*'
        ],
        resources: [`arn:aws:s3:::${artifactBucket.bucketName}/*`],
    }));
    artifactBucket.addToResourcePolicy(new iam.PolicyStatement({
        sid: 'CrossAccountS3ListPolicy',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ArnPrincipal(`arn:aws:iam::${devopsAccountId}:root`)],
        actions: ['s3:ListBucket'],
        resources: [`arn:aws:s3:::${artifactBucket.bucketName}`],
    }));

    new CfnOutput(stack, `ArtifactBucketArn`, {
        value: artifactBucket.bucketArn
    });

    return artifactBucket.bucketArn;
}

export default createArtifactBucket;