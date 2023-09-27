import * as path from 'path';
import * as cdk from "aws-cdk-lib";
import { Stack } from "aws-cdk-lib";
import { Duration } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as secrets from "aws-cdk-lib/aws-secretsmanager";
import * as Iam from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

/**
 * Cognitoトリガー用のLambdaを作成
 * @param stack construct
 * @param deploymentStage string
 * @param lyerArn string
 */

const createCognitoTrigeerLambda = (stack: Stack, deploymentStage: string, lyerArn: string ):void => {

    const DEPLOYMENT_STAGE = deploymentStage || 'stg';
    const id = `${DEPLOYMENT_STAGE}-auth-CognitoTrigeerLambda`;

    // VPCをパラメータストアから取得
    const VPC_ID: string = StringParameter.valueFromLookup(stack, `/vpc/${DEPLOYMENT_STAGE}/AuthVpcId`);
    const vpc = ec2.Vpc.fromLookup(stack, `${id}-VPC`, {
        vpcId: VPC_ID,
    });

    //セキリュティグループをパラメータストアから取得
    const SECURITY_GROUP_ID: string = StringParameter.valueFromLookup(stack, `/${DEPLOYMENT_STAGE}/AuthDbconnectionSecurityGroupId`);
    const dbConnectionGroup = ec2.SecurityGroup.fromSecurityGroupId(stack, `${id}-dbconnectionGroup`, SECURITY_GROUP_ID);

    // 認証情報のARNをパラメータストアから取得
    const DB_SECRET_ARN: string = StringParameter.fromStringParameterAttributes(stack, `${id}-dbSecretArn`, {
        parameterName: `/secret/${DEPLOYMENT_STAGE}/AuthDbSecretArn`}).stringValue;

    const databaseCredentialsSecret = secrets.Secret.fromSecretCompleteArn(stack, `${id}-dbSecret`, DB_SECRET_ARN);
    
    // -------Lambda用のIAMロール-----------
    const iamRoleForLambda = new Iam.Role(stack, `${id}-iamRoleForLambda`, {
        roleName: `${id}-lambda-role`,
        assumedBy: new Iam.ServicePrincipal("lambda.amazonaws.com"),
        // VPCに設置するためのポリシー定義
        managedPolicies: [
            Iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaVPCAccessExecutionRole"
            ),
        ],
    });

    // -------Lambda-----------
    const appLambda = new NodejsFunction(stack, `${id}-Api`, {
        functionName: `${id}-lambda`,
        entry: path.join(__dirname, "../../lambda/index.ts"), // どのコードを使用してデプロイするか
        handler: "handler", // どの関数を実行するか
        runtime: lambda.Runtime.NODEJS_16_X, // バージョン
        timeout: Duration.seconds(60), // 何秒でタイムアウトするか
        role: iamRoleForLambda, // どのIAMロールを使用するか
        vpc: vpc, // VPCにアタッチ
        vpcSubnets: vpc.selectSubnets({
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }),
        securityGroups: [dbConnectionGroup],
        environment: {
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1", // keepaliveを有効にする
            DB_SECRET_ARN: databaseCredentialsSecret.secretArn, // SecretマネージャーARN
        },
        memorySize: 128, // default=128
        currentVersionOptions: {
            removalPolicy: cdk.RemovalPolicy.DESTROY, // prod環境の場合は削除保護を有効
        },
        //カスタムレイヤーを使用する
        layers: [
            lambda.LayerVersion.fromLayerVersionArn(
                stack,
                `${id}-rds-orcl-lyer`,
                lyerArn
            ),
        ],
        logRetention: logs.RetentionDays.INFINITE
    });

    // ------Secretmanagerへのアクセス許可をLabmdaロールに付与-------
    databaseCredentialsSecret.grantRead(appLambda);

    // パラメータストアにLambdaのArnを保存
    new StringParameter(stack, `${DEPLOYMENT_STAGE}-CognitoTrigeer-LambdaArn`, {
        parameterName: `/lambda/${DEPLOYMENT_STAGE}/cognitoTriggerLambdaArn`,
        stringValue: appLambda.functionArn,
    });

}

export default createCognitoTrigeerLambda;