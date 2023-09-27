import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { StringParameter } from "aws-cdk-lib/aws-ssm";


interface TestEc2StackProps extends cdk.StackProps {
  deploymentStage: string;
}

export class TestEc2Stack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: TestEc2StackProps) {
        super(scope, id, props);
        
    const vpc = ec2.Vpc.fromLookup(this, 'VPC', { vpcId: 'vpc-0aa69f48561623440' });



    /*
    -----Security Group-----
    疎通確認用に置くVMに関連付ける新たなセキュリティグループを作成します。
    */ 
    const VmSecurityGroup = new ec2.SecurityGroup(this,"Tgw Security Group",{
      vpc: vpc,
      }
    );

    VmSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), //すべてのIPv4アドレスからのトラフィックを許可します。
      ec2.Port.allTraffic()
    );
    
    
    /* SSM IAM Role
    AWS Systems ManagerのIAMロールを作成しています。
    このIAMロールは、EC2インスタンスがAWS Systems Managerによって管理されることを許可します。
    */
    const ssmIamRole = new cdk.aws_iam.Role(this, "SSM IAM Role", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonSSMManagedInstanceCore"
        ),
      ],
    });

    // ------EC2 Instance-------
    new cdk.aws_ec2.Instance(this, "EC2 Instance B", {
      instanceType: new cdk.aws_ec2.InstanceType("t3.micro"),
      machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux({
        generation: cdk.aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      vpc: vpc,
      blockDevices: [
        {
          deviceName: "/dev/xvda",
          volume: cdk.aws_ec2.BlockDeviceVolume.ebs(8, {
            volumeType: cdk.aws_ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
      propagateTagsToVolumeOnCreation: true,
      vpcSubnets: vpc.selectSubnets({
        subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }),
      role: ssmIamRole,
      securityGroup: VmSecurityGroup,
    });



  };
}