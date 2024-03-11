import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_cloudfront, aws_cloudfront_origins, aws_iam, aws_s3, Stack, StackProps } from 'aws-cdk-lib';
import { BlockPublicAccess } from 'aws-cdk-lib/aws-s3';

interface CdkCloudfrontS3StackProps extends StackProps {
  accountId: string;
}

export class CdkCloudfrontS3Stack extends cdk.Stack {
  public readonly contentsBucket: aws_s3.IBucket;
  public readonly distribution: aws_cloudfront.IDistribution;

  constructor(scope: Construct, id: string, props: CdkCloudfrontS3StackProps) {
    super(scope, id, props);

    this.contentsBucket = new aws_s3.Bucket(this, 'ContentsBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // distributionLogBucket
    const logBucket = new aws_s3.Bucket(this, 'LogBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      objectOwnership: aws_s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      lifecycleRules: [
        {
          id: 'LogBucketLifecycleRule',
          enabled: true,
          expiration: cdk.Duration.days(10),
        },
      ],
    });

    //OAC
    const cfnOriginAccessControl = new aws_cloudfront.CfnOriginAccessControl(this, 'OriginAccessControl', {
      originAccessControlConfig: {
        name: 'OriginAccessControlForContentsBucket',
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
        description: 'Access Control',
      },
    });

    // CloudFront
    this.distribution = new aws_cloudfront.Distribution(this, 'Distribution', {
      comment: 'distribution.',
      defaultBehavior: {
        origin: new aws_cloudfront_origins.S3Origin(this.contentsBucket),
        allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_ALL,
      },
      defaultRootObject: 'index.html',
      httpVersion: aws_cloudfront.HttpVersion.HTTP2_AND_3,
      logBucket: logBucket,
      logFilePrefix: 'distribution',
    });

    const cfnDistribution = this.distribution.node.defaultChild as aws_cloudfront.CfnDistribution;
    //OAI削除
    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity', '');
    //OAC追加
    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.OriginAccessControlId', cfnOriginAccessControl.attrId);

    // S3 - BucketPolicy
    const contentsBucketPolicyStatement = new aws_iam.PolicyStatement({
      actions: ['s3:GetObject'],
      effect: aws_iam.Effect.ALLOW,
      principals: [new aws_iam.ServicePrincipal('cloudfront.amazonaws.com')],
      resources: [`${this.contentsBucket.bucketArn}/*`],
    });

    contentsBucketPolicyStatement.addCondition('StringEquals', {
      'AWS:SourceArn': `arn:aws:cloudfront::${props.accountId}:distribution/${this.distribution.distributionId}`,
    });
    this.contentsBucket.addToResourcePolicy(contentsBucketPolicyStatement);

    //end
  }
}
