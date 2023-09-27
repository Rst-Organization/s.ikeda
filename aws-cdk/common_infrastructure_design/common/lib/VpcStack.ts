import * as cdk from "aws-cdk-lib";
import {Stack, StackProps, CfnOutput} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { StringParameter, StringListParameter } from "aws-cdk-lib/aws-ssm";

interface VpcStackProps extends StackProps {
    deploymentStage: string,
    projectName: string,
}

export class VpcStack extends Stack {

    constructor(scope: Construct, id: string, props?: VpcStackProps) {
        super(scope, id, props);

    const DEPLOYMENT_STAGE = props?.deploymentStage || "stg";
    const PROJECT_NAME = props?.projectName || "Myapp";

    // ------VPCの作成-------
    const vpc = new ec2.Vpc(this, "VPC", {
        cidr: "192.168.1.0/16", //状況に合わせて変更
        vpcName: `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-vpc`,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        subnetConfiguration: [
            {
            cidrMask: 24,
            name: "Public",
            subnetType: ec2.SubnetType.PUBLIC,
            },
            {
            cidrMask: 26,
            name: "Private",
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
            {
            cidrMask: 28,
            name: "TransitGatewayAttachment",
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            },
        ],
        natGateways: 0, // NATゲートウェイが不要な場合は0にする
        maxAzs: 2,
    });

    // ------VPCのSecurity Group-------
    const vpcSecurityGroup = new ec2.SecurityGroup(this, "VPC Security Group", {
        securityGroupName: `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-vpc-sg`,
        vpc: vpc,
    });
    vpcSecurityGroup.addIngressRule(
        ec2.Peer.anyIpv4(), //状況に合わせて変更する
        ec2.Port.allTraffic(),
    )

    // ------ECRへのVPCエンドポイントを作成。-----
    new ec2.InterfaceVpcEndpoint(this, "ECR Private Link", {
        vpc: vpc,
        service: ec2.InterfaceVpcEndpointAwsService.ECR,
    });

    new ec2.InterfaceVpcEndpoint(this, "ECRPrivateLinkDocker", {
        vpc: vpc,
        service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
    });

    new ec2.InterfaceVpcEndpoint(this, "LogPrivateLink", {
        vpc: vpc,
        service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
    });

    vpc.addGatewayEndpoint("S3PrivateLink", {
        service: ec2.GatewayVpcEndpointAwsService.S3,
        subnets: [
            {
                subnets: vpc.privateSubnets,
            },
        ],
    });

    //------Seacret ManagerへのVPCエンドポイントを作成。------
    new ec2.InterfaceVpcEndpoint(this, "SecretManagerVpcEndpoint", {
        vpc: vpc,
        service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    //---TransitGatewayとアタッチする場合に備えてVpcID,TGWサブネットのIDをパラメータストアに保存----
    const TgwAttachmentSubnetIds: string[] = vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    }).subnets.map(subnet => subnet.subnetId);

    new StringListParameter(this, "TransitGwAttachmentSubnetIdList", {
        parameterName: `/vpc/${DEPLOYMENT_STAGE}-${PROJECT_NAME}/TgwAttachmentSubnetIdList`,
        stringListValue: TgwAttachmentSubnetIds,
    });
    new StringParameter(this, "VpcId", {
        parameterName: `/vpc/${DEPLOYMENT_STAGE}-${PROJECT_NAME}/VpcId`,
        stringValue: vpc.vpcId,
    });

    //---TransitGatewayと接続するサブネットのルートテーブルIDをパラメータストアに保存----
    const privateSubnetRouteTableIds: string[] = vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    }).subnets.map(subnet => subnet.routeTable.routeTableId);
    
    new StringListParameter(this, "PrivateSubnetRouteTableIdList", {
        parameterName: `/vpc/${DEPLOYMENT_STAGE}-${PROJECT_NAME}/PrivateSubnetRouteTableIdList`,
        stringListValue: privateSubnetRouteTableIds,
    });

    new CfnOutput(this, "Vpc-Id", {
        value: vpc.vpcId,
    });
    new CfnOutput(this, "Vpc-Arn", {
        value: vpc.vpcArn,
    });
    
    
    };
}
