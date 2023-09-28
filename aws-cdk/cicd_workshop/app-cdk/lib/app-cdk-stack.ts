import { Stack, StackProps, Duration } from "aws-cdk-lib";
import { CfnService } from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2"


interface ConsumerProps extends StackProps {
  ecrRepository: ecr.Repository;
}

export class AppCdkStack extends Stack {
  public readonly fargateService: ecsPatterns.ApplicationLoadBalancedFargateService;
  public readonly greenTargetGroup: elbv2.ApplicationTargetGroup;
  public readonly greenLoadBalancerListener: elbv2.ApplicationListener;

  constructor(scope: Construct, id: string, props: ConsumerProps) {
    super(scope, `${id}-app-stack`, props);

    const vpc = new ec2.Vpc(this, `${id}Vpc`);

    const cluster = new ecs.Cluster(this, `${id}EcsCluster`, {
      vpc: vpc,
    });

    if (`${id}` == 'prod'){
      this.fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        `${id}FargateService`,
        {
          cluster: cluster,
          memoryLimitMiB: 1024,
          cpu: 512,
          desiredCount: 1,
          taskImageOptions: {
            image: ecs.ContainerImage.fromEcrRepository(props.ecrRepository),
            containerName: 'my-app',
            containerPort: 3000
          },
          deploymentController: {
            type: ecs.DeploymentControllerType.CODE_DEPLOY
          },
          publicLoadBalancer: true
        } 
      );
      
      //ver 2.98.0ではまだ未解決のバグがあるため、一時的に以下のコードを追加している
      //https://github.com/aws/aws-cdk/issues/26307
      //https://zenn.dev/n04h/scraps/475a5a3f2b5314
      const cfnService = this.fargateService.service.node.defaultChild as CfnService;
      cfnService.addPropertyDeletionOverride('DeploymentConfiguration.Alarms');

      this.greenLoadBalancerListener = this.fargateService.loadBalancer.addListener(`${id}GreenLoadBalancerListener`, {
        port: 81, protocol: elbv2.ApplicationProtocol.HTTP 
      });

      this.greenTargetGroup = new elbv2.ApplicationTargetGroup(this, `${id}GreenTargetGroup`, {
        port: 80,
        targetType: elbv2.TargetType.IP,
        vpc: vpc
      });

      this.greenLoadBalancerListener.addTargetGroups(`${id}GreenListener`, {
        targetGroups: [ this.greenTargetGroup ]
      });

      this.greenTargetGroup.configureHealthCheck({
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        timeout: Duration.seconds(10),
        interval:Duration.seconds(11)
      });

    } else {
      this.fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        `${id}FargateService`,
        {
          cluster: cluster,
          memoryLimitMiB: 1024,
          cpu: 512,
          desiredCount: 1,
          taskImageOptions: {
            image: ecs.ContainerImage.fromEcrRepository(props.ecrRepository),
            containerName: 'my-app',
            containerPort: 3000
          },
          publicLoadBalancer: true
        } 
      );
    }
    this.fargateService.targetGroup.configureHealthCheck({
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 2,
      timeout: Duration.seconds(10),
      interval:Duration.seconds(11)
    });

    //登録解除の遅延 (ストリーミング間隔)
    this.fargateService.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '5');
    
  }
}

