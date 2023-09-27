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


interface LambdaOracleStackProps extends cdk.StackProps {
    deploymentStage: string;
}

export class LambdaOracleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: LambdaOracleStackProps) {
    super(scope, id, props);

    const DEPLOYMENT_STAGE = props?.deploymentStage || 'Stg';

    // ------VPCの作成-------

    const vpc = new ec2.Vpc(this, "VPC", {
        cidr: "10.0.0.0/16", //可変できるようにする
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

    // -----Lambda関数からSecret ManagerにアクセスするためのVPCエンドポイント------
    new ec2.InterfaceVpcEndpoint(this, "SecretManagerVpcEndpoint", {
        vpc: vpc,
        service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    // -----セキュリティグループの作成--------
    const bastionGroup = new ec2.SecurityGroup(this, 'Bastion to DB', {vpc});
    const dbConnectionGroup = new ec2.SecurityGroup(this, "RDS Connection to DB",{vpc});

    // -----セキュリティグループにインバウンドルール(1521)を追加--------
    dbConnectionGroup.addIngressRule(
        dbConnectionGroup,
        ec2.Port.tcp(1521),
        "allow db connection"
    );
    
    // ------セキュリティグループにインバウンドルール(踏み台からの1521)を追加-------
    dbConnectionGroup.addIngressRule(
        bastionGroup,
        ec2.Port.tcp(1521),
        'allow bastion connection'
    );

    // -----パブリックサブネットにRDS接続用の踏み台サーバを配置する【必要であればコメント外す】-----
    const host = new ec2.BastionHostLinux(this, `${id}-BastionHost`, {
        vpc,
        instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T2,
            ec2.InstanceSize.MICRO
        ),
        securityGroup: bastionGroup,
        subnetSelection: {
            subnetType: ec2.SubnetType.PUBLIC,
        }
    });


    // ------踏み台サーバにOracleのモジュール(basicとsqlplus)をインストール【必要であればコメント外す】----- 
    host.instance.addUserData("yum -y update",
                              "wget https://download.oracle.com/otn_software/linux/instantclient/2111000/oracle-instantclient-basic-21.11.0.0.0-1.el8.x86_64.rpm",
                              "wget https://download.oracle.com/otn_software/linux/instantclient/2111000/oracle-instantclient-sqlplus-21.11.0.0.0-1.el8.x86_64.rpm",
                              "yum -y localinstall oracle-instantclient-basic-21.11.0.0.0-1.el8.x86_64.rpm",
                              "yum -y localinstall oracle-instantclient-sqlplus-21.11.0.0.0-1.el8.x86_64.rpm");


    // ------RDSの認証情報を作成してSecretマネージャーに保存-----------
    const databaseCredentialsSecret = new secrets.Secret(
        this,
        "DBCredentialsSecret",
        {
            secretName: `${id}-rds-credentials`,
            generateSecretString: {
                secretStringTemplate: JSON.stringify({
                    username: "syscdk",
                }),
                excludePunctuation: true, //特殊文字を含めない
                includeSpace: false, //スペースを含めるか
                generateStringKey: "password", //パスワードのキー名(パスワードは自動生成)
                passwordLength: 10, //パスワードの長さは30文字以内
            },
        }
    );


    //------- RDSの作成 (Oracle)-----------

    //バックアップの保持日数
    const backupRetention = DEPLOYMENT_STAGE === "Prod" ? Duration.days(35) : Duration.days(1);
    //Oracleのバージョン
    const version = DEPLOYMENT_STAGE === "Prod" ? rds.OracleEngineVersion.VER_19_0_0_0_2020_04_R1 : rds.OracleEngineVersion.VER_19_0_0_0_2020_04_R1;
    //インスタンスタイプ
    const instanceType = DEPLOYMENT_STAGE === "Prod" ? ec2.InstanceType.of(
        ec2.InstanceClass.M5, ec2.InstanceSize.LARGE) : ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE);

    const rdsInstance = new rds.DatabaseInstance(this, "DBInstance", {
        // DBインスタンス名
        instanceIdentifier: `${id}-oracle`,
        /*
        データベースエンジンの指定
        https://docs.aws.amazon.com/cdk/api/v2/java/software/amazon/awscdk/services/rds/OracleEngineVersion.html
        */
        engine: rds.DatabaseInstanceEngine.oracleSe2({
            version: version,
        }),
        // ライセンスモデル
        licenseModel: rds.LicenseModel.LICENSE_INCLUDED,
        // 認証情報
        credentials: rds.Credentials.fromSecret(databaseCredentialsSecret),
        /*
        Oracleで対応するインスタンスタイプ
        https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Oracle.Concepts.InstanceClasses.html
        */
        instanceType: instanceType,
        // VPC(プライベートサブネットに配置)
        vpc,
        vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        // セキュリティグループ
        securityGroups: [dbConnectionGroup],
        // 自動バックアップの保持日数
        backupRetention: backupRetention, 
        // Cloudformationのスタック削除時にRDSを削除する
        removalPolicy: RemovalPolicy.DESTROY,
        // DBが誤って削除されるのを防ぐかどうか
        deletionProtection: false,
        // パラメータグループ
        parameterGroup: new rds.ParameterGroup(this, "ParameterGroup", {
            engine: rds.DatabaseInstanceEngine.oracleSe2({
            version: version,
            }),
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

    // -------Lambda-----------
    const appLambda = new NodejsFunction(this, "Api", {
        functionName: `${id}-lambda`,
        entry: "lambda/oracle/index.ts", // どのコードを使用するか
        runtime: lambda.Runtime.NODEJS_16_X, // どのバージョンか
        timeout: Duration.seconds(60), // 何秒でタイムアウトするか
        role: iamRoleForLambda, // どのIAMロールを使用するか
        vpc: vpc, // VPCに設置する場合に必要
        vpcSubnets: vpc.selectSubnets({
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }),
        securityGroups: [dbConnectionGroup],
        environment: {
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1", // keepaliveを有効にする
            DB_SECRET_ARN: databaseCredentialsSecret.secretArn, // SecretマネージャーARN
        },
        memorySize: 128, // default=128
    });

    // ------Secretmanagerへのアクセス許可をLabmdaロールに付与-------
    databaseCredentialsSecret.grantRead(appLambda);

    // ------API Gatewayの作成-------
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

    // ------API GatewayのエンドポイントにLambdaを紐付け-------
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