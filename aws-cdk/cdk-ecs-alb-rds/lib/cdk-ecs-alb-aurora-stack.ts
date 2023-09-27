import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import { DatabaseCluster, DatabaseClusterEngine } from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';
import { Policy, Role, PolicyStatement } from 'aws-cdk-lib/aws-iam';


export class CdkEcsAlbAuroraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

      // VPC
      const vpc = new ec2.Vpc(this, 'testvpc', {
        ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
        natGateways: 0,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'public',
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: 'private',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
          // {
          //   cidrMask: 28,
          //   name: 'rds',
          //   subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          // },
        ],
      });

    // security group
    const ecsSG = new ec2.SecurityGroup(this, 'testEcsSG', {
      vpc,
      allowAllOutbound: true,
    });

    const rdsSG = new ec2.SecurityGroup(this, 'testRdsSG', {
      vpc,
      allowAllOutbound: true,
    });

    // RDSのセキュリティグループにECSのセキュリティグループからのアクセスを許可
    rdsSG.connections.allowFrom(ecsSG, ec2.Port.tcp(3306), 'ingress 3306 from ECS');

    // ECRへのプライベートエンドポイントを作成
    vpc.addInterfaceEndpoint('ecrDockerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
    });

    vpc.addInterfaceEndpoint("ecr-endpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.ECR
    })

    vpc.addInterfaceEndpoint("logs-endpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS
    })

    vpc.addGatewayEndpoint("s3-endpoint", {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnets: vpc.isolatedSubnets
        }
      ]
    })

    //RDSへのプライベートエンドポイントを作成
    vpc.addInterfaceEndpoint('rdsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.RDS,
      subnets: {
        subnets: vpc.isolatedSubnets,
      },
    });

    //シークレットマネージャーへのプライベートエンドポイントを作成
    vpc.addInterfaceEndpoint('seacretsmanagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: {
        subnets: vpc.isolatedSubnets,
      },
    });

    // RDS Aurora
    const rdsCluster = new DatabaseCluster(this, 'testAuroraCluster', {
      engine: DatabaseClusterEngine.AURORA_MYSQL,
      instanceProps: {
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [rdsSG],
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE2,
          ec2.InstanceSize.SMALL
        ),
      },
      defaultDatabaseName: 'testdb',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    //SeacretsManager
    const seacretsmanager = rdsCluster.secret!;

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'testCluster', {
      vpc: vpc,
    });
        
    // ECR Repository
    const ecrRepository = ecr.Repository.fromRepositoryName(this, 'test', 'test');

    // ALB, FargateService, TaskDefinition
    const loadBalancedFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      'testFargateService',
      {
        cluster: cluster, //必須
        memoryLimitMiB: 512, // default 512
        cpu: 256, // default 256
        desiredCount: 1, // オプション 省略した場合は3
        listenerPort: 80, // ALBのリスナーポート
        taskImageOptions: {
          image: ecs.ContainerImage.fromEcrRepository(ecrRepository,'latest'), //ECRからイメージを取得
          containerPort: 80, // タスク定義のコンテナポート
          secrets: {
            "dbname": ecs.Secret.fromSecretsManager(seacretsmanager, 'dbname'),
            "username": ecs.Secret.fromSecretsManager(seacretsmanager, 'username'),
            "host": ecs.Secret.fromSecretsManager(seacretsmanager, 'host'),
            "password": ecs.Secret.fromSecretsManager(seacretsmanager, 'password'),
          },
          environment: {
            "hogehogekey": "hogehogevalue",
          },
        },
        securityGroups: [ecsSG], // オプション セキュリティグループ
        healthCheckGracePeriod: cdk.Duration.seconds(3600), // オプション ALBのヘルスチェックの待機時間 240秒
        publicLoadBalancer: true, // オプション ALBをpublicにするかどうか
      }
    );

    // Healthcheckの設定
    loadBalancedFargateService.targetGroup.configureHealthCheck({
      path: '/', // ヘルスチェックのパス
      healthyHttpCodes: '200', // ヘルスチェックの成功コード
      interval: cdk.Duration.seconds(30), // ヘルスチェックの間隔
      healthyThresholdCount: 2, // ヘルスチェックの成功回数
    });

    // FaragateServiceのタスク定義にSecretsManagerの権限を付与
    const ecsExecutionRole = Role.fromRoleArn(this,
      'ecsExecutionRole',
      loadBalancedFargateService.taskDefinition.executionRole!.roleArn,
      {}
    );
    // ecsExecutionRoleというロールにseacretsmanagerの読み取りポリシー権限を作成して付与
    ecsExecutionRole.attachInlinePolicy(new Policy(this, 'testSmgGetpolicy', {
      statements: [new PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [seacretsmanager.secretArn],
      })],
    }));


  };
}

