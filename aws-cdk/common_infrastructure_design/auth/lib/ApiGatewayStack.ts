import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import { StringParameter } from 'aws-cdk-lib/aws-ssm';


interface ApiGatewayStackProps extends cdk.StackProps {
    deploymentStage: string;
}

export class ApiGatewayStack extends cdk.Stack {

    public readonly restApi: apigw.RestApi;

    constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
        super(scope, id, props);
    
        const DEPLOYMENT_STAGE = props.deploymentStage || "stg";
        
        
        //パラメータストアからLambdaArnを取得
        const LAMBDA_ARN: string = StringParameter.fromStringParameterAttributes(this, "cognitoTriggerLambdaArn", {
            parameterName: `/lambda/${DEPLOYMENT_STAGE}/cognitoTriggerLambdaArn`}).stringValue;
        const cognitoTrigerlambda = lambda.Function.fromFunctionArn(this, `${DEPLOYMENT_STAGE}-cognitoTriggerLambda`, LAMBDA_ARN);
        
        const GET_DB_LAMBDA_ARN: string = StringParameter.fromStringParameterAttributes(this, "GetDbLambdaArn", {
            parameterName: `/lambda/${DEPLOYMENT_STAGE}/GetDbLambdaArn`}).stringValue;
        const getDblambda = lambda.Function.fromFunctionArn(this, `${DEPLOYMENT_STAGE}-GetDbLambda`, GET_DB_LAMBDA_ARN);
        
        const PUT_DB_LAMBDA_ARN: string = StringParameter.fromStringParameterAttributes(this, "PutDbLambdaArn", {
            parameterName: `/lambda/${DEPLOYMENT_STAGE}/PutDbLambdaArn`}).stringValue;
        const putDblambda = lambda.Function.fromFunctionArn(this, `${DEPLOYMENT_STAGE}-PutDbLambda`, PUT_DB_LAMBDA_ARN);
        
        //パラメータストアからCognitoUserPoolArnを取得
        const COGNITO_USER_POOL_ARN: string = StringParameter.fromStringParameterAttributes(this, "CognitoUserPoolArn", {
            parameterName: `/cognito/${DEPLOYMENT_STAGE}/CognitoUserPoolArn`}).stringValue;
        const userPool = cognito.UserPool.fromUserPoolArn(this, `${DEPLOYMENT_STAGE}-userPool`, COGNITO_USER_POOL_ARN);

        //パラメータストアからDynamoDBNameを取得
        const DYNAMO_DB_NAME: string = StringParameter.fromStringParameterAttributes(this, "AuthDynamoDbName", {
            parameterName: `/${DEPLOYMENT_STAGE}/AuthDynamoDbName`}).stringValue;

        //パラメータストアからDynamoDBロールのArnを取得
        const INTEGRATION_ROLE_ARN: string = StringParameter.fromStringParameterAttributes(this, "DynamoDbIntegrationRoleArn", {
            parameterName: `/${DEPLOYMENT_STAGE}/AuthDynamoDbIntegrationRoleArn`}).stringValue;
        const integrationRole = iam.Role.fromRoleArn(this, `${DEPLOYMENT_STAGE}-integration-role`, INTEGRATION_ROLE_ARN);

        // -------API Gatewayを作成-------
        const restApi = new apigw.RestApi(this, "RestApi", {
            restApiName: `${DEPLOYMENT_STAGE}-restApi`,
            deployOptions: {
                stageName: DEPLOYMENT_STAGE,
            },
            //CORS設定 ※状況によって変更
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
                allowMethods: apigw.Cors.ALL_METHODS,
                allowHeaders: apigw.Cors.DEFAULT_HEADERS,
                statusCode: 200,
            },
        });
        
        // -------CognitoのAuthorizerを作成-------
        const cognitoAuthorizer = new apigw.CognitoUserPoolsAuthorizer(
            this,
            "CognitoAuthorizer",
            {
                cognitoUserPools: [userPool],
                authorizerName: `${DEPLOYMENT_STAGE}-authorizer`,
                identitySource: "method.request.header.Authorization",
            }
            );
        
        // ------エンドポイントを作成し、LambdaとCognito認証を統合-------

        // Lambda Integration /API
        const restApiRoot = restApi.root.addResource("api");
        restApiRoot.addMethod( "ANY", new apigw.LambdaIntegration(cognitoTrigerlambda), {
                authorizer: cognitoAuthorizer,
            },

        );
        
        // Lambda Integration /getdata
        const restApiGetData = restApi.root.addResource("getdata");
        restApiGetData.addMethod( "ANY", new apigw.LambdaIntegration(getDblambda), {
                authorizer: cognitoAuthorizer,
            }
        );

        // Lambda Integration /putdata
        const restApiPutData = restApi.root.addResource("putdata");
        restApiPutData.addMethod( "ANY", new apigw.LambdaIntegration(putDblambda), {
                authorizer: cognitoAuthorizer,
            }
        );

        // -------DynamoDB用のエンドポイントを作成 GET,PUT,DELETE -------
        const dynamoDbRoot = restApi.root.addResource("dynamo");

        // Get Integration to DynamoDB
        const dynamoQueryIntegration = new apigw.AwsIntegration({
            service: "dynamodb",
            action: "GetItem",
            options: {
                passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_TEMPLATES,
                credentialsRole: integrationRole,
                requestTemplates: {
                    "application/json": JSON.stringify(
                        {
                            "TableName": DYNAMO_DB_NAME,
                            "Key":{
                                "USER_ID":{
                                    "S":"$input.params('USER_ID')"
                                },
                                "SYSTEM_ID_AND_RESERVATION_ID": {
                                    "S": "$input.params('SYSTEM_ID_AND_RESERVATION_ID')"
                                }
                            }
                        }
                    ),
                },
                integrationResponses: [{ statusCode: "200" }],
            },
        });

        dynamoDbRoot.addMethod("GET", dynamoQueryIntegration, {
            authorizer: cognitoAuthorizer,
            methodResponses: [{ statusCode: "200" }],
            requestParameters: {
                "method.request.querystring.USER_ID": true,
                "method.request.querystring.SYSTEM_ID_AND_RESERVATION_ID": true,
            },
        });

        // Put Integration to DynamoDB
        const dynamoPutIntegration = new apigw.AwsIntegration({
            service: "dynamodb",
            action: "PutItem",
            options: {
                passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_TEMPLATES,
                credentialsRole: integrationRole,
                requestTemplates: {
                    "application/json": JSON.stringify(
                        {
                            "TableName": DYNAMO_DB_NAME,
                            "Item":{
                                "USER_ID":{
                                    "S":"$input.path('$.USER_ID')"
                                },
                                "SYSTEM_ID_AND_RESERVATION_ID": {
                                    "S": "$input.path('$.SYSTEM_ID_AND_RESERVATION_ID')"
                                },
                                "VALUE": {
                                    "S": "$input.path('$.VALUE')"
                                }
                            }
                        }
                    ),
                },
                integrationResponses: [{ statusCode: "200" }],
            },
        });

        dynamoDbRoot.addMethod("PUT", dynamoPutIntegration, {
            authorizer: cognitoAuthorizer,
            methodResponses: [{ statusCode: "200" }],
        });

        // Delete Integration to DynamoDB
        const dynamoDeleteIntegration = new apigw.AwsIntegration({
            service: "dynamodb",
            action: "DeleteItem",
            options: {
                passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_TEMPLATES,
                credentialsRole: integrationRole,
                requestTemplates: {
                    "application/json": JSON.stringify(
                        {
                            "TableName": DYNAMO_DB_NAME,
                            "Key":{
                                "USER_ID":{
                                    "S":"$input.params('USER_ID')"
                                },
                                "SYSTEM_ID_AND_RESERVATION_ID": {
                                    "S": "$input.params('SYSTEM_ID_AND_RESERVATION_ID')"
                                }
                            }
                        }
                    ),
                },
                integrationResponses: [{ statusCode: "200" }],
            },
        });

        dynamoDbRoot.addMethod("DELETE", dynamoDeleteIntegration, {
            authorizer: cognitoAuthorizer,
            methodResponses: [{ statusCode: "200" }],
            requestParameters: {
                "method.request.querystring.USER_ID": true,
                "method.request.querystring.SYSTEM_ID_AND_RESERVATION_ID": true,
            },
        });

        this.restApi = restApi;
    
    };
}