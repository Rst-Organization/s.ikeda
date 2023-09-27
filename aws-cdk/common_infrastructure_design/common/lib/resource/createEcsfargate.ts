import * as cdk from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { Stack, Duration } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as log from "aws-cdk-lib/aws-logs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as secrets from "aws-cdk-lib/aws-secretsmanager";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

/**
 * 
 * @param stack construct
 * @param deploymentStage string
 * @param projectName string
 * @param ecrRepositoryArn string
 * @param seacretManagerArn string
 * @returns fargateService ecsPatterns.ApplicationLoadBalancedFargateService
*/

const createEcsFargate = (
    stack: Stack, 
    deploymentStage: string, 
    projectName: string, 
    ecrRepositoryArn: string, 
    seacretManagerArn: string) : ecsPatterns.ApplicationLoadBalancedFargateService => {

    const DEPLOYMENT_STAGE = deploymentStage || "stg";
    const PROJECT_NAME = projectName || "myApp";

    //パラメータストアからVPCを取得
    const VPC_ID: string = StringParameter.valueFromLookup(stack, `/vpc/${DEPLOYMENT_STAGE}-${PROJECT_NAME}/VpcId`);
    const vpc = ec2.Vpc.fromLookup(stack, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-Fargate-VPC`, {
        vpcId: VPC_ID,
    });

    //EcrArnからECRを取得
    const ecrRepository = ecr.Repository.fromRepositoryAttributes(stack, "ECR", {
      repositoryArn: ecrRepositoryArn,
      repositoryName: `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-repo`,
    });
    
    //SecretManagerArnからSecretManagerを取得
    const seacretManager = secrets.Secret.fromSecretCompleteArn(stack, "SecretManager", seacretManagerArn);

    // ------クラスターの作成-----------
    const cluster = new ecs.Cluster(stack, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-Cluster`, {
      clusterName: `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-Cluster`,
      vpc: vpc,
    });

    //ECSのセキリュティグループを作成
    const ecsSecurityGroup = new ec2.SecurityGroup(stack, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-EcsSecurityGroup`, {
      vpc: vpc,
      allowAllOutbound: true,
      description: "ECS Security Group",
      securityGroupName: `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-EcsSG`,
    });

    // -------Fargateサービス/ALBの作成-----------
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(stack, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-FargateService`, {
        cluster: cluster,
        serviceName: `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-FargateService`,
        memoryLimitMiB: 1024, //メモリの上限値 (随時変更)
        cpu: 512, //CPUの上限 (随時変更)
        desiredCount: 1, //デプロイするタスク数 (随時変更)
        assignPublicIp: false, //FargateのIPをpublicにするか
        enableExecuteCommand: false, //コンテナに対してexecute commandを実行できるか
        securityGroups: [ecsSecurityGroup], //セキュリティグループ
        taskSubnets: vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }),
        taskImageOptions: {
          //ECR内のイメージを使用(tagの指定がない場合はLatestが使用される)
          image: ecs.ContainerImage.fromEcrRepository(ecrRepository),
          containerName: `${PROJECT_NAME}-container`,
          containerPort: 80, //コンテナのポート番号
          //ログの設定
          logDriver: ecs.LogDrivers.awsLogs({
            streamPrefix: `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-FargateService`,
            logGroup: new log.LogGroup(stack, `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-LogGroup`, {
              logGroupName: `/aws/ecs/${DEPLOYMENT_STAGE}-${PROJECT_NAME}-LogGroup`,
              retention: DEPLOYMENT_STAGE === "prod" ? log.RetentionDays.INFINITE : log.RetentionDays.INFINITE, //ログの保持期間
              removalPolicy: cdk.RemovalPolicy.DESTROY, //ロググループの削除ポリシー
            }),
          }),
          environment: {
            NODE_ENV: DEPLOYMENT_STAGE,
            DB_SECRET_ARN: seacretManager.secretArn,
          },
          secrets: {
            DB_USERNAME: ecs.Secret.fromSecretsManager(
              seacretManager,
              "username"
            ),
            DB_PASSWORD: ecs.Secret.fromSecretsManager(
              seacretManager,
              "password"
            ),
            DB_HOST: ecs.Secret.fromSecretsManager(
              seacretManager,
              "host"
            ),
            DB_PORT: ecs.Secret.fromSecretsManager(
              seacretManager,
              "port"
            ),
            DB_NAME: ecs.Secret.fromSecretsManager(
              seacretManager,
              "dbname"
            ),
          },
        },
        loadBalancerName: `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-ALB`,
        publicLoadBalancer: true, //ALBがインターネットに接続されるかどうか
        listenerPort: 80, //ALBのリスナーポート
      }
    );

    // --------ターゲットグループのヘルスチェック設定-----------
    fargateService.targetGroup.configureHealthCheck({
      healthyThresholdCount: 2, //成功とみなすまでの連続した正常な応答の数
      unhealthyThresholdCount: 2, //失敗とみなすまでの連続した異常な応答の数
      timeout: Duration.seconds(60), //タイムアウトまでの秒数
      interval:Duration.seconds(120) //ヘルスチェック秒間隔
    });

    //スティッキーセッションを有効にする場合はコメント外す(lb_cookie)
    //fargateService.targetGroup.enableCookieStickiness(Duration.days(7));
    
    // -------ターゲットグループから登録解除される際に適用される遅延時間-----------
    fargateService.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '5');

    // -------以下はAuto Scaling Policyの設定に関する記述です。必要に応じて変更してください。-----------

    // const autoscaling = fargateService.service.autoScaleTaskCount({
    //   minCapacity: 1, //最小タスク数
    //   maxCapacity: 2, //最大タスク数
    // });
    
    // //メモリ使用率でのスケーリングポリシー
    // autoscaling.scaleOnMemoryUtilization(`${DEPLOYMENT_STAGE}-${PROJECT_NAME}-MemoryUtilization`, {
    //   targetUtilizationPercent: 80, //メモリ使用率の閾値
    //   scaleInCooldown: Duration.seconds(60), //スケールインのクールダウン時間
    //   scaleOutCooldown: Duration.seconds(60), //スケールアウトのクールダウン時間
    // });

    // //CPU使用率でのスケーリングポリシー
    // autoscaling.scaleOnCpuUtilization(`${DEPLOYMENT_STAGE}-${PROJECT_NAME}-CpuUtilization`, {
    //   targetUtilizationPercent: 80, //CPU使用率の閾値
    //   scaleInCooldown: Duration.seconds(60), //スケールインのクールダウン時間
    //   scaleOutCooldown: Duration.seconds(60), //スケールアウトのクールダウン時間
    // });


    return fargateService;

};

export default createEcsFargate;

