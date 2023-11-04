import * as cdk from 'aws-cdk-lib';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctions_tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda_event_sources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import * as log from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export class StepfunctionsRestApiStack extends cdk.Stack {
  constructor(app: cdk.App, id: string, props?: cdk.StackProps) {
    super(app, id);

    const bucket = new s3.Bucket(this, 'MyRekognitionBucket');

    const helloLambda = new NodejsFunction(this, 'HelloLambda', {
      functionName: 'HelloLambda',
      entry: path.join(__dirname, '../lambda/index.ts'),
      handler: 'handler',
      bundling: {
        forceDockerBundling: false,
      },
      timeout: cdk.Duration.seconds(300),
    });

    // lambda function as a step function task
    const startState = new stepfunctions_tasks.LambdaInvoke(
      this,
      'CDKLambdaInvoke',
      {
        lambdaFunction: helloLambda,
        // payloadResponseOnly: true,
        // // // Lambda's result is in the attribute `Payload`
        outputPath: stepfunctions.JsonPath.stringAt('$.Payload'),
      }
    );

    // Define choice state
    const choiceState = new stepfunctions.Choice(this, 'hellowLambdaChoice');

    // Define Rekognition task
    const rekognitionTask = new stepfunctions_tasks.CallAwsService(
      this,
      'DetectLabels',
      {
        service: 'rekognition',
        action: 'detectLabels',
        iamResources: ['*'],
        parameters: {
          Image: {
            S3Object: {
              Bucket: bucket.bucketName,
              Name: stepfunctions.JsonPath.stringAt('$.imageKey'), // Use the imageKey from Lambda's response
            },
          },
          MaxLabels: 3,
        },
        additionalIamStatements: [
          new iam.PolicyStatement({
            actions: ['s3:GetObject'],
            resources: [`arn:aws:s3:::${bucket.bucketName}/*`],
          }),
        ],
      }
    );

    const successState = new stepfunctions.Pass(this, 'SuccessState', {
      result: stepfunctions.Result.fromObject({
        message: 'Rekognition was successful',
      }),
    });

    // Add conditions to the choice state
    choiceState
      .when(stepfunctions.Condition.isPresent('$.imageKey'), rekognitionTask)
      .otherwise(successState);

    rekognitionTask.next(successState);
    startState.next(choiceState);

    const stateMachine = new stepfunctions.StateMachine(
      this,
      'CDKStateMachine',
      {
        definition: startState,
        stateMachineType: stepfunctions.StateMachineType.EXPRESS,
        logs: {
          destination: new log.LogGroup(this, 'CDKLogGroup', {
            logGroupName: 'stepfunctions-log-group',
            retention: log.RetentionDays.ONE_DAY,
          }),
          level: stepfunctions.LogLevel.ALL,
        },
      }
    );

    const api = new apigateway.StepFunctionsRestApi(
      this,
      'CDKStepFunctionsRestApi',
      { stateMachine: stateMachine }
    );

    //end
  }
}
