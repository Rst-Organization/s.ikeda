import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Stack, StackProps, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';


interface CdkEcsStackProps extends StackProps {
    deploymentStage: string,
    ecrRepository: ecr.Repository;
}

export class EcsFargateStack extends Stack {
  public readonly fargateService: ecsPatterns.ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props: CdkEcsStackProps) {
    super(scope, id, props);

    const DEPLOYMENT_STAGE = props?.deploymentStage || 'Stg';

    // -------VPCの作成-----------
    const vpc = new ec2.Vpc(this, `${id}-VPC`,{
        cidr: "10.0.0.0/16", //可変できるようにする
        vpcName: `${id}-vpc`,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        subnetConfiguration: [
            {
                cidrMask: 24,
                name: `${id}-PublicSubnet`,
                subnetType: ec2.SubnetType.PUBLIC,
            },
            {
                cidrMask: 24,
                name: `${id}-PrivateSubnet`,
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            },
        ],
        // natGateways: 1, // NATゲートウェイが必要な場合は指定
        maxAzs: 2,
    });

    // ------クラスターの作成-----------
    const cluster = new ecs.Cluster(this, `${id}-Cluster`, {
      vpc: vpc
    });

    // -------サービス/ALBの作成-----------
    this.fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      `${id}-FargateService`,
       {
        cluster: cluster,
        publicLoadBalancer: true, //ALBをpublicにするか
        memoryLimitMiB: 1024, //メモリの上限
        cpu: 512, //CPUの上限
        desiredCount: 1, //デプロイするタスク数
        taskImageOptions: {
          image: ecs.ContainerImage.fromEcrRepository(props.ecrRepository),
          containerName: `${id}-container`,
          containerPort: 3000, //コンテナのポート
        },
      }
    );

    // --------ターゲットグループの設定-----------

    this.fargateService.targetGroup.configureHealthCheck({
      healthyThresholdCount: 2, //成功とみなすまでの連続した正常な応答の数
      unhealthyThresholdCount: 2, //失敗とみなすまでの連続した異常な応答の数
      timeout: Duration.seconds(10), //タイムアウトまでの秒数
      interval:Duration.seconds(11) //ヘルスチェック秒間隔
    });
    
    // -------ターゲットグループから登録解除される際に適用される遅延時間-----------

    this.fargateService.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '5');



    

  };
}
