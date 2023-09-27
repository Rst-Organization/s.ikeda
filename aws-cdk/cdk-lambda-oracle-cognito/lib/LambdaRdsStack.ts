import * as cdk from "aws-cdk-lib";
import { RemovalPolicy, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secrets from "aws-cdk-lib/aws-secretsmanager";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as Iam from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

interface LambdaRdsProps extends cdk.StackProps {
    deploymentStage: string;
}


export class LambdaRdsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: LambdaRdsProps) {
        super(scope, id, props);

        const DEPLOYMENT_STAGE = props.deploymentStage;

        // -------VPCの作成-----------
        const vpc = new ec2.Vpc(this, "VPC", {
            cidr: "10.0.0.0/16",
            vpcName: `${id}-vpc`,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            subnetConfiguration: [
                {
                cidrMask: 24,
                name: "PublicSubnet",
                subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                cidrMask: 24,
                name: "PrivateSubnet",
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                },
            ],
            // natGateways: 1, // NATゲートウェイが必要な場合は指定
            maxAzs: 2,
        });

        // -----Lambda関数からSecret ManagerにアクセスするためのVPCエンドポイント-----
        new ec2.InterfaceVpcEndpoint(this, "SecretManagerVpcEndpoint", {
            vpc: vpc,
            service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        });

        // -----セキュリティグループの作成---------
        const bastionGroup = new ec2.SecurityGroup(this, 'Bastion to DB', {vpc});
        const lambdaToRDSProxyGroup = new ec2.SecurityGroup(this, "Lambda to RDSProxy", {vpc});
        const dbConnectionGroup = new ec2.SecurityGroup(this, "RDSProxy to DB",{vpc});

        //-----踏み台サーバーのセキュリティグループにインバウンドルール(3306)を追加----
        dbConnectionGroup.addIngressRule(
            dbConnectionGroup,
            ec2.Port.tcp(3306),
            "allow db connection"
        );
        
        //-----RDSProxyのセキュリティグループにインバウンドルール(Lambdaからの3306)を追加-----
        dbConnectionGroup.addIngressRule(
            lambdaToRDSProxyGroup,
            ec2.Port.tcp(3306),
            "allow lambda connection"
        );
        
        //------RDSProxyのセキュリティグループにインバウンドルール(踏み台からの3306)を追加------
        dbConnectionGroup.addIngressRule(
            bastionGroup,
            ec2.Port.tcp(3306),
            'allow bastion connection'
        );

        // -----パブリックサブネットにRDS接続用の踏み台サーバを配置する---------
        const host = new ec2.BastionHostLinux(this, "BastionHost", {
            vpc,
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.T4G,
                ec2.InstanceSize.NANO
            ),
            securityGroup: bastionGroup,
            subnetSelection: {
                subnetType: ec2.SubnetType.PUBLIC,
            },
            machineImage: new ec2.GenericLinuxImage({
                "ap-northeast-1": "ami-0342c9aa06b2a6488", // Ubuntu 22.04 LTS
            }),
        });

        // ------踏み台サーバにMySQLクライアントをインストール--------
        host.instance.addUserData("apt -y update", "apt install -y mysql-client");

        // ------RDSの認証情報を作成してSecretマネージャーに保存--------
        const databaseCredentialsSecret = new secrets.Secret(
            this,
            "DBCredentialsSecret",
            {
                secretName: id + "-rds-credentials",
                generateSecretString: {
                    secretStringTemplate: JSON.stringify({
                        username: "syscdk",
                    }),
                    excludePunctuation: true, //特殊文字を含めるか
                    includeSpace: false, //スペースを含めるか
                    generateStringKey: "password", //パスワードのキー名(パスワードは自動生成)
                },
            }
        );


        // ------RDSの作成 (MySql)-----------

        const rdsInstance = new rds.DatabaseInstance(this, "DBInstance", {
            // データベースエンジン
            engine: rds.DatabaseInstanceEngine.mysql({
                version: rds.MysqlEngineVersion.VER_8_0,
            }),
            // 認証情報
            credentials: rds.Credentials.fromSecret(databaseCredentialsSecret),
            // インスタンスタイプ
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            // VPC(プライベートサブネットに配置)
            vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            },
            // セキュリティグループ
            securityGroups: [dbConnectionGroup],
            // Cloudformationのスタック削除時にRDSを削除する
            removalPolicy: RemovalPolicy.DESTROY,
            // DBが誤って削除されるのを防ぐかどうか
            deletionProtection: false,
            // パラメータグループ
            parameterGroup: new rds.ParameterGroup(this, "ParameterGroup", {
                engine: rds.DatabaseInstanceEngine.mysql({
                version: rds.MysqlEngineVersion.VER_8_0,
                }),
                parameters: {
                character_set_client: "utf8mb4",
                character_set_server: "utf8mb4",
                },
            }),
        });

        // ------RDS Proxyの作成-----------
        const proxy = rdsInstance.addProxy(`${id}-proxy`, {
            secrets: [databaseCredentialsSecret], //RDSの認証情報
            debugLogging: true, // デバッグログを出力するか
            securityGroups: [dbConnectionGroup], //RDSのセキュリティグループをアタッチ
            requireTLS: true, // TLSを必須にするか
            vpc,
            vpcSubnets: vpc.selectSubnets({
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            }),
        });

        // -------Lambda用のIAMロール-----------
        const iamRoleForLambda = new Iam.Role(this, "iamRoleForLambda", {
            roleName: `${id}-lambda-role`,
            assumedBy: new Iam.ServicePrincipal("lambda.amazonaws.com"),
            // VPCに設置するためのポリシー定義
            managedPolicies: [
                Iam.ManagedPolicy.fromAwsManagedPolicyName(
                "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
            ],
        });

        // --------Lambda-------------
        const appLambda = new NodejsFunction(this, "Api", {
            entry: "lambda/mysql/index.ts", // どのコードを使用するか
            runtime: lambda.Runtime.NODEJS_16_X, // どのバージョンか
            timeout: Duration.seconds(60), // 何秒でタイムアウトするか
            role: iamRoleForLambda, // どのIAMロールを使用するか
            vpc: vpc, // VPCに設置する場合に必要
            vpcSubnets: vpc.selectSubnets({
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            }),
            securityGroups: [lambdaToRDSProxyGroup],
            environment: {
                PROXY_ENDPOINT: proxy.endpoint,
                AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1", // keepaliveを有効にする
                DB_SECRET_ARN: databaseCredentialsSecret.secretArn, // SecretマネージャーARN
            },
            memorySize: 128, // default=128
        });

        // -----Secretmanagerへのアクセス許可をLabmdaロールに付与------
        databaseCredentialsSecret.grantRead(appLambda);

        // -----API Gatewayの作成---------
        const restApi = new apigw.RestApi(this, "RestApi", {
            restApiName: `${id}-rds-proxy`,
            deployOptions: {
                stageName: DEPLOYMENT_STAGE,
            },
            // CORS設定
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
                allowMethods: apigw.Cors.ALL_METHODS,
                allowHeaders: apigw.Cors.DEFAULT_HEADERS,
                statusCode: 200,
            },
        });

        // ------API GatewayのエンドポイントにLambdaを紐付け--------
        restApi.root.addProxy({
            defaultIntegration: new apigw.LambdaIntegration(appLambda),
            anyMethod: true
        });

        // API Gatewayのエンドポイントを出力
        // new cdk.CfnOutput(this, "ApiEndpoint", {
        //     value: restApi.url,
        // });


    };
}