import * as cdk from "aws-cdk-lib";
import { RemovalPolicy, Duration, Stack } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secrets from "aws-cdk-lib/aws-secretsmanager";
import * as logs from "aws-cdk-lib/aws-logs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

/*
- データベースエンジンの指定
  - https://docs.aws.amazon.com/cdk/api/v2/java/software/amazon/awscdk/services/rds/OracleEngineVersion.html
- Oracleで対応するインスタンスタイプ
  - https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Oracle.Concepts.InstanceClasses.html
*/

/**
 * 
 * @param stack construct
 * @param deploymentStage string
 * @param projectName string
 * @returns databaseCredentialsSecret.secretArn string
*/

const createDataBase = (stack: Stack, deploymentStage: string, projectName: string) : string => {

    const DEPLOYMENT_STAGE = deploymentStage || 'stg';
    const PROJECT_NAME = projectName || 'myApp';
    const VPC_ID: string = StringParameter.valueFromLookup(stack, `/vpc/${DEPLOYMENT_STAGE}-${PROJECT_NAME}/VpcId`);
    const vpc = ec2.Vpc.fromLookup(stack, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-Database-VPC`, { vpcId: VPC_ID });

    // ------セキュリティグループの作成-------
    const dbConnectionGroup = new ec2.SecurityGroup(stack, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-RDS Connection to DB`, { vpc });

    // -----セキュリティグループにインバウンドルール(1521)を追加--------
    dbConnectionGroup.addIngressRule(
        dbConnectionGroup,
        ec2.Port.tcp(1521),
        "allow db connection"
    );

    // ------RDSの認証情報を作成してSecretマネージャーに保存-----------
    const databaseCredentialsSecret = new secrets.Secret(stack, "DBCredentialsSecret", {
        secretName: `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-rds-credentials`,
        generateSecretString: {
            secretStringTemplate: JSON.stringify({
                username: "syscdk",
            }),
            excludePunctuation: true,
            includeSpace: false,
            generateStringKey: "password",
            passwordLength: 10, //パスワードの長さ(30文字以内)
        },
        //スタックを削除しても削除されないようにする ※prodはRETAIN(削除されない)、それ以外はDESTROY
        removalPolicy: DEPLOYMENT_STAGE === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    }
    );


    //------- RDSの作成 (Oracle)-----------

    //バックアップの保持日数 (prodは35日、それ以外は1日)
    const backupRetention = DEPLOYMENT_STAGE === "prod" ? Duration.days(35) : Duration.days(1);
    //マルチAZにするかどうか (現状は全てTrue)
    const multiAz = DEPLOYMENT_STAGE === "prod" ? true : true;
    //Oracleのバージョン (適宜変更)
    const version = DEPLOYMENT_STAGE === "prod" ? rds.OracleEngineVersion.VER_19_0_0_0_2020_04_R1 : rds.OracleEngineVersion.VER_19_0_0_0_2020_04_R1;
    //インスタンスタイプ (適宜変更)
    const instanceType = DEPLOYMENT_STAGE === "prod" ? ec2.InstanceType.of(
        ec2.InstanceClass.M5, ec2.InstanceSize.LARGE) : ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE);

    //---DBインスタンスの作成---
    const rdsInstance = new rds.DatabaseInstance(stack, "DBInstance", {
        // DBインスタンス名
        instanceIdentifier: `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-oracle`,
        engine: rds.DatabaseInstanceEngine.oracleSe2({
            version: version,
        }),
        // ライセンスモデル (ライセンス含有タイプ)
        licenseModel: rds.LicenseModel.LICENSE_INCLUDED,
        // 認証情報
        credentials: rds.Credentials.fromSecret(databaseCredentialsSecret),
        instanceType: instanceType,
        // VPC(プライベートサブネットに配置)
        vpc,
        vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        // セキュリティグループ
        securityGroups: [dbConnectionGroup],
        // 自動バックアップの保持日数
        backupRetention: backupRetention,
        // マルチAZ
        multiAz: multiAz,
        //パブリックアクセスの許可 ※現状は全てfalseに
        publiclyAccessible: DEPLOYMENT_STAGE === "prod" ? false : false,
        // DB削除保護の有効化 ※prodはtrue、それ以外はfalse
        deletionProtection: DEPLOYMENT_STAGE === "prod" ? true : false,
        parameterGroup: new rds.ParameterGroup(stack, "ParameterGroup", {
            engine: rds.DatabaseInstanceEngine.oracleSe2({
                version: version,
            }),
        }),
        optionGroup: new rds.OptionGroup(stack, "OptionGroup", {
            configurations: [
                {
                    name: "Timezone",
                    settings: {
                        TIME_ZONE: "Asia/Tokyo",
                    },
                },

            ],
            engine: rds.DatabaseInstanceEngine.oracleSe2({
                version: version,
            }),
            description: "timezone set JST",
        }),
        //CloudWatchログのエクスポート
        cloudwatchLogsExports: ["trace", "audit", "alert", "listener"],
        //CloudWatchログの保存期間 (現状は無期限なので適宜変更)
        cloudwatchLogsRetention: DEPLOYMENT_STAGE === "prod" ? logs.RetentionDays.INFINITE : logs.RetentionDays.INFINITE,
        // Cloudformationのスタック削除時にRDSを削除する ※prodはRETAIN(削除されない)、それ以外はDESTROY
        removalPolicy: DEPLOYMENT_STAGE === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    //CAを変更 ※L1クラスへキャストする事で詳細設定を行う
    const cfnInstance = rdsInstance.node.defaultChild as rds.CfnDBInstance;
    cfnInstance.addPropertyOverride("CACertificateIdentifier", "rds-ca-rsa4096-g1");

    // ------セキュリティグループの作成(踏み台からの1521) 【踏み台が必要であれば以下のコメント外す】-------
    const bastionGroup = new ec2.SecurityGroup(stack, 'Bastion to DB', { vpc });

    // ------セキュリティグループにインバウンドルール(踏み台からの1521)を追加 【踏み台が必要であれば以下のコメント外す】-----
    dbConnectionGroup.addIngressRule(
        bastionGroup,
        ec2.Port.tcp(1521),
        'allow bastion connection'
    );

    // -----パブリックサブネットにRDS接続用の踏み台サーバを配置する【必要であればコメント外す】-----
    const host = new ec2.BastionHostLinux(stack, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-BastionHost`, {
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

    /* ----スナップショットからDBを作成する場合はARNを記載し、以下のコメントを外し、スナップショットのARNを記載し、DBインスタンス名を変更して再度デプロイする------
    それに伴いHOST名は変更されるが、パスワード等は変更されることはない。記載したARNをその後も指定しないと空の新しいDBが作成されるので注意。
    */
    // const cfnInstance = rdsInstance.node.defaultChild as rds.CfnDBInstance;
    // cfnInstance.addPropertyOverride("DBSnapshotIdentifier", "<SnapShotArn>");

    // ------踏み台サーバにOracleのモジュール(basicとsqlplus)をインストール【必要であればコメント外す】----- 
    host.instance.addUserData("yum -y update",
        "wget https://download.oracle.com/otn_software/linux/instantclient/2111000/oracle-instantclient-basic-21.11.0.0.0-1.el8.x86_64.rpm",
        "wget https://download.oracle.com/otn_software/linux/instantclient/2111000/oracle-instantclient-sqlplus-21.11.0.0.0-1.el8.x86_64.rpm",
        "yum -y localinstall oracle-instantclient-basic-21.11.0.0.0-1.el8.x86_64.rpm",
        "yum -y localinstall oracle-instantclient-sqlplus-21.11.0.0.0-1.el8.x86_64.rpm");

    new cdk.CfnOutput(stack, "DBInstanceSeacretArn", {
        value: databaseCredentialsSecret.secretArn,
    });

    return databaseCredentialsSecret.secretArn;

};

export default createDataBase;
