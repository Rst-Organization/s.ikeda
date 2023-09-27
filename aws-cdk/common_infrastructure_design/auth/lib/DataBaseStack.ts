import * as cdk from "aws-cdk-lib";
import { RemovalPolicy, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secrets from "aws-cdk-lib/aws-secretsmanager";
import * as logs from "aws-cdk-lib/aws-logs";
import { StringParameter } from 'aws-cdk-lib/aws-ssm';


interface DatabaseStackProps extends cdk.StackProps {
    deploymentStage: string;
}

export class DataBaseStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props: DatabaseStackProps) {
        super(scope, id, props);

        const DEPLOYMENT_STAGE = props.deploymentStage || 'stg';

        // VPCをパラメータストアから取得
        const VPC_ID: string = StringParameter.valueFromLookup(this, `/vpc/${DEPLOYMENT_STAGE}/AuthVpcId`);
        const vpc = ec2.Vpc.fromLookup(this, `${id}-VPC`, {
            vpcId: VPC_ID,
        });
        
        // ------セキュリティグループの作成-------
        const dbConnectionGroup = new ec2.SecurityGroup(this, "RDS Connection to DB",{vpc});
        
        // -----セキュリティグループにインバウンドルール(1521)を追加--------
        dbConnectionGroup.addIngressRule(
            dbConnectionGroup,
            ec2.Port.tcp(1521),
            "allow db connection"
        );
        
        // ------RDSの認証情報を作成してSecretマネージャーに保存-----------
        const databaseCredentialsSecret = new secrets.Secret(this, "DBCredentialsSecret", {
                secretName: `${id}2-rds-credentials`,
                generateSecretString: {
                    secretStringTemplate: JSON.stringify({
                        username: "syscdk",
                    }),
                    excludePunctuation: true, //特殊文字を含めない
                    includeSpace: false, //スペースを含めるか
                    generateStringKey: "password", //パスワードのキー名(パスワードは自動生成)
                    passwordLength: 10, //パスワードの長さ(30文字以内)
                },
                //スタックを削除しても削除されないようにするか ※RETAIN(削除されない)、or DESTROY
                removalPolicy: RemovalPolicy.DESTROY,
            },
        );


        //------- RDSの作成 (Oracle)-----------

        //バックアップの保持日数 (prodは35日、それ以外は1日)
        const backupRetention = DEPLOYMENT_STAGE === "prod" ? Duration.days(35) : Duration.days(1);
        
        //Oracleのバージョン ※適宜変更 (https://docs.aws.amazon.com/cdk/api/v2/java/software/amazon/awscdk/services/rds/OracleEngineVersion.html)
        const version = DEPLOYMENT_STAGE === "prod" ? rds.OracleEngineVersion.VER_19_0_0_0_2020_04_R1 : rds.OracleEngineVersion.VER_19_0_0_0_2020_04_R1;

        //インスタンスタイプ ※適宜変更 (https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Oracle.Concepts.InstanceClasses.html)
        const instanceType = DEPLOYMENT_STAGE === "prod" ? ec2.InstanceType.of(
            ec2.InstanceClass.M5, ec2.InstanceSize.LARGE) : ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE);
        
        //---DBインスタンスの作成---
        const rdsInstance = new rds.DatabaseInstance(this, "DBInstance", {
            instanceIdentifier: `${id}-oracle`,
            engine: rds.DatabaseInstanceEngine.oracleSe2({
                version: version,
            }),
            // ライセンスモデル (含有タイプ)
            licenseModel: rds.LicenseModel.LICENSE_INCLUDED,
            // 認証情報
            credentials: rds.Credentials.fromSecret(databaseCredentialsSecret),
            // インスタンスタイプ
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
            multiAz: true,
            //パブリックアクセスの許可
            publiclyAccessible: true,
            // DB削除保護の有効化
            deletionProtection: true,
            // パラメータグループ
            parameterGroup: new rds.ParameterGroup(this, "ParameterGroup", {
                engine: rds.DatabaseInstanceEngine.oracleSe2({
                    version: version,
                }),
            }),
            optionGroup: new rds.OptionGroup(this, "OptionGroup", {
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
            //CloudWatchログの保存期間 (現状は無制限)
            cloudwatchLogsRetention: DEPLOYMENT_STAGE === "prod" ? logs.RetentionDays.INFINITE : logs.RetentionDays.INFINITE,
            removalPolicy: RemovalPolicy.DESTROY,
        });

        //CAを変更
        const cfnInstance = rdsInstance.node.defaultChild as rds.CfnDBInstance;
        cfnInstance.addPropertyOverride("CACertificateIdentifier", "rds-ca-rsa4096-g1");

        //パラメータストアにDBSecretManagerのARNを保存
        new StringParameter(this, `/secret/${DEPLOYMENT_STAGE}/AuthDbSecretArn`, {
            parameterName: `/secret/${DEPLOYMENT_STAGE}/AuthDbSecretArn`,
            stringValue: databaseCredentialsSecret.secretArn,
        });

        //セキリュティグループのIDをSSMに保存
        new StringParameter(this, `/${DEPLOYMENT_STAGE}/AuthDbconnectionSecurityGroupId`, {
            parameterName: `/${DEPLOYMENT_STAGE}/AuthDbconnectionSecurityGroupId`,
            stringValue: dbConnectionGroup.securityGroupId,
        });

        /* ----スナップショットからDBを作成する場合はARNを記載し、以下のコメントを外し、スナップショットのARNを記載し、DBインスタンス名を変更して再度デプロイする------
        それに伴いHOST名は変更されるが、パスワード等は変更されることはない。記載したARNをその後も指定しないと空の新しいDBが作成されるので注意。
        */
        // const cfnInstance = rdsInstance.node.defaultChild as rds.CfnDBInstance;
        // cfnInstance.addPropertyOverride("DBSnapshotIdentifier", "arn:aws:rds:ap-northeast-1:186208509235:snapshot:rds:stg-auth-databasestack-oracle-2023-08-30-08-01");

        // ------セキュリティグループの作成(踏み台からの1521) 【踏み台が必要であれば以下のコメント外す】-------
        const bastionGroup = new ec2.SecurityGroup(this, 'Bastion to DB', {vpc});

        // ------セキュリティグループにインバウンドルール(踏み台からの1521)を追加 【踏み台が必要であれば以下のコメント外す】-----
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


    
    };
}