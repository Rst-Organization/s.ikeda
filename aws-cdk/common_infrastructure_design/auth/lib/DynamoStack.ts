import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

interface DynamoStackProps extends cdk.StackProps {
    readonly deploymentStage: string;
    readonly projectName: string;
}

// ------DynamoDB 作成------
export class DynamoStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props: DynamoStackProps) {
        super(scope, id, props);

        const DEPLOYMENT_STAGE = props?.deploymentStage || "stg";
        const PROJECT_NAME = props?.projectName || "auth";

        const dynamoDb = new dynamodb.Table(this, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-table`, {
        tableName: `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-table`, // テーブル名の定義
        //パーティションキーの定義
        partitionKey: {
            name: "USER_ID",
            type: dynamodb.AttributeType.STRING,
        },
        //ソートキーの定義
        sortKey: {
            name: "SYSTEM_ID_AND_RESERVATION_ID",
            type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,  // 課金タイプ (オンデマンド)
        pointInTimeRecovery: true, // PITRを有効化
        timeToLiveAttribute: "expired", // TTLの設定
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES, // DynamoDB Streamsを有効化
        removalPolicy: cdk.RemovalPolicy.DESTROY, // cdk destroyでDB削除するかどうか
        });

        // ------API Gateway から DynamoDB へのアクセス権限を付与------
        const integrationRole = new iam.Role(this, `${DEPLOYMENT_STAGE}-integration-role`, {
            assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
        });
        
        dynamoDb.grantReadWriteData(integrationRole);

        //SSMパラメータストアにDynamoDBTableNameを保存
        new StringParameter(this, `${DEPLOYMENT_STAGE}-DynamoDbName`, {
            parameterName: `/${DEPLOYMENT_STAGE}/AuthDynamoDbName`,
            stringValue: dynamoDb.tableName,
        });

        //SSMパラメータストアにロールArnを保存
        new StringParameter(this, `${DEPLOYMENT_STAGE}-IntegrationRoleArn`, {
            parameterName: `/${DEPLOYMENT_STAGE}/AuthDynamoDbIntegrationRoleArn`,
            stringValue: integrationRole.roleArn,
        });


    };
}