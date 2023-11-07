import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda_event_sources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import * as sqs from 'aws-cdk-lib/aws-sqs';

interface LambdaRestApiStackProps extends cdk.StackProps {
  channelAccessToken: string;
  channelSecret: string;
  openaiApiKey: string;
}

export class LambdaRestApiStack extends cdk.Stack {
  constructor(app: cdk.App, id: string, props: LambdaRestApiStackProps) {
    super(app, id);

    //S3バケットを作成
    const bucket = new s3.Bucket(this, 'MyRekognitionBucket');
    //2つSQSを作成
    const sqs1 = new sqs.Queue(this, 'MyQueue', {
      visibilityTimeout: cdk.Duration.seconds(400),
    });
    const sqs2 = new sqs.Queue(this, 'SecondQueue', {
      visibilityTimeout: cdk.Duration.seconds(400),
    });

    //遅延FIFO SQSを作成
    const sqs3 = new sqs.Queue(this, 'ThirdQueue', {
      fifo: true,
      visibilityTimeout: cdk.Duration.seconds(400),
      //遅延設定(最大15分後にメッセージを配信できる)
      deliveryDelay: cdk.Duration.seconds(180),
    });

    //Lambda1つめ
    const helloLambda = new NodejsFunction(this, 'HelloLambda', {
      functionName: 'HelloLambda',
      entry: path.join(__dirname, '../lambda/index.ts'),
      handler: 'handler',
      bundling: {
        forceDockerBundling: false,
      },
      environment: {
        CHANNEL_ACCESS_TOKEN: props.channelAccessToken,
        CHANNEL_SECRET: props.channelSecret,
        BUCKET_NAME: bucket.bucketName,
        SQS_URL: sqs1.queueUrl,
        OPENAI_API_KEY: props.openaiApiKey,
        RECOMMEND_SQS_URL: sqs3.queueUrl,
      },
      timeout: cdk.Duration.seconds(300),
    });

    //LambdaのロールにS3へのアクセス権限を付与
    bucket.grantReadWrite(helloLambda);
    //LambdaのロールにSQSへのアクセス権限を付与
    sqs1.grantSendMessages(helloLambda);
    sqs3.grantSendMessages(helloLambda);
    sqs3.grantConsumeMessages(helloLambda);

    //API GatewayとLambdaを統合
    const api = new apigateway.LambdaRestApi(this, 'CDKStepFunctionsRestApi', {
      handler: helloLambda,
    });

    //SQSトリガーで起動するLambdaを定義
    const helloLambda2 = new NodejsFunction(this, 'HelloLambda2', {
      functionName: 'HelloLambda2',
      entry: path.join(__dirname, '../lambda/index2.ts'),
      handler: 'handler',
      bundling: {
        forceDockerBundling: false,
      },
      environment: {
        BUCKET_NAME: bucket.bucketName,
        CHANNEL_ACCESS_TOKEN: props.channelAccessToken,
        CHANNEL_SECRET: props.channelSecret,
        SQS_URL: sqs1.queueUrl,
        SECOUND_SQS_URL: sqs2.queueUrl,
        OPENAI_API_KEY: props.openaiApiKey,
        RECOMMEND_SQS_URL: sqs3.queueUrl,
      },
      timeout: cdk.Duration.seconds(300),
    });
    helloLambda2.addEventSource(
      new lambda_event_sources.SqsEventSource(sqs1, {
        batchSize: 1,
      })
    );

    sqs1.grantConsumeMessages(helloLambda2);
    bucket.grantReadWrite(helloLambda2);
    //Lambda2のロールにレコグニションへのアクセス権限を付与
    helloLambda2.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['rekognition:*'],
        resources: ['*'],
      })
    );
    sqs2.grantSendMessages(helloLambda2);
    sqs3.grantSendMessages(helloLambda);

    //SQSトリガーで起動するLambda3を定義
    const helloLambda3 = new NodejsFunction(this, 'HelloLambda3', {
      functionName: 'HelloLambda3',
      entry: path.join(__dirname, '../lambda/index3.ts'),
      handler: 'handler',
      bundling: {
        forceDockerBundling: false,
      },
      environment: {
        BUCKET_NAME: bucket.bucketName,
        CHANNEL_ACCESS_TOKEN: props.channelAccessToken,
        CHANNEL_SECRET: props.channelSecret,
        SQS_URL: sqs2.queueUrl,
        OPENAI_API_KEY: props.openaiApiKey,
        RECOMMEND_SQS_URL: sqs3.queueUrl,
      },
      timeout: cdk.Duration.seconds(300),
    });
    helloLambda3.addEventSource(
      new lambda_event_sources.SqsEventSource(sqs2, {
        batchSize: 1,
      })
    );

    sqs2.grantConsumeMessages(helloLambda3);
    sqs3.grantSendMessages(helloLambda);

    bucket.grantReadWrite(helloLambda3);
    //Lambda3のロールにレコグニションへのアクセス権限を付与
    helloLambda3.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['rekognition:*'],
        resources: ['*'],
      })
    );

    //SQSトリガーで起動するLambda4を定義
    const helloLambda4 = new NodejsFunction(this, 'HelloLambda4', {
      functionName: 'HelloLambda4',
      entry: path.join(__dirname, '../lambda/index4.ts'),
      handler: 'handler',
      bundling: {
        forceDockerBundling: false,
      },
      environment: {
        BUCKET_NAME: bucket.bucketName,
        CHANNEL_ACCESS_TOKEN: props.channelAccessToken,
        CHANNEL_SECRET: props.channelSecret,
        SQS_URL: sqs3.queueUrl,
        OPENAI_API_KEY: props.openaiApiKey,
      },
      timeout: cdk.Duration.seconds(300),
    });
    helloLambda4.addEventSource(
      new lambda_event_sources.SqsEventSource(sqs3, {
        batchSize: 1,
      })
    );
    sqs3.grantConsumeMessages(helloLambda4);
    sqs3.grantSendMessages(helloLambda4);

    //end
  }
}
