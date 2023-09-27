import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { StringParameter, StringListParameter } from 'aws-cdk-lib/aws-ssm';


interface NetworkStackProps extends cdk.StackProps {
    deploymentStage: string;
}

export class NetworkStack extends cdk.Stack {  
  constructor(scope: Construct, id: string, props?: NetworkStackProps) {
    super(scope, id, props);

    const DEPLOYMENT_STAGE = props?.deploymentStage || 'stg';

        // ------VPCの作成-------

        const vpc = new ec2.Vpc(this, "VPC", {
            cidr: "10.0.0.0/16", //状況に合わせて変更
            vpcName: `${id}-vpc`,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            subnetConfiguration: [
                {
                cidrMask: 24,
                name: "Public",
                subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                cidrMask: 24,
                name: "Private",
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
                {
                cidrMask: 28,
                name: "TransitGatewayAttachment",
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                }
            ],
            natGateways: 0, // NATゲートウェイが必要な場合は1に設定
            maxAzs: 2,
        });

        // VPCサブネットのルートテーブルIDをパラメータストアに保存します。
        const privateSubnetRouteTableIds: string[] = vpc.selectSubnets({ 
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnets.map(subnet => subnet.routeTable.routeTableId);

        new StringListParameter(this, "PrivateSubnetRouteTableIdList", {
            parameterName: `/vpc/${DEPLOYMENT_STAGE}/PrivateSubnetRouteTableIdList`,
            stringListValue: privateSubnetRouteTableIds,
        });

        //VPCのIDをパラメータストアに保存します。
        new StringParameter(this, `${DEPLOYMENT_STAGE}AuthVpcId`, {
            parameterName: `/vpc/${DEPLOYMENT_STAGE}/AuthVpcId`,
            stringValue: vpc.vpcId,
        });

        // -----Lambda関数からSecret ManagerにアクセスするためのVPCエンドポイント------
        new ec2.InterfaceVpcEndpoint(this, "SecretManagerVpcEndpoint", {
            vpc: vpc,
            service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        });

        // -----DynamoDBへアクセスするためのVPCエンドポイント------
        new ec2.GatewayVpcEndpoint(this, "DynamoDBVpcEndpoint", {
            vpc: vpc,
            service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        });
        
        // -----TransitGatewayの作成-----
        const tgw = new cdk.aws_ec2.CfnTransitGateway(this, "Transit Gateway", {
            amazonSideAsn: 65000, //Transit GatewayのASN番号を設定します。この値は、Amazon側のASN番号である65000を設定しています。
            autoAcceptSharedAttachments: "enable", //このプロパティをenableに設定すると、Transit Gatewayは自動的に共有アタッチメントを受け入れます。
            defaultRouteTableAssociation: "enable", //このプロパティをenableに設定すると、Transit Gatewayは自動的にデフォルトルートテーブルの関連付けます。
            defaultRouteTablePropagation: "enable", //このプロパティをenableに設定すると、Transit Gatewayはデフォルトルートテーブルを自動的に伝播します。
            dnsSupport: "enable", //このプロパティをenableに設定すると、Transit GatewayはDNSサポートを有効にします。
            multicastSupport: "enable", //このプロパティをenableに設定すると、Transit Gatewayはマルチキャストサポートを有効にします。
            tags: [
            {
                key: "Name",
                value: "tgw", //Name
            },
            ],
            vpnEcmpSupport: "enable", //このプロパティをenableに設定すると、Transit GatewayはVPN ECMPサポートを有効にします。
        });
  
      // ----Transit Gateway attachment-----
        const tgwVpcAttachment = new cdk.aws_ec2.CfnTransitGatewayVpcAttachment(this, "Transit Gateway attachment VPC", {
            subnetIds: vpc.selectSubnets({
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            }).subnetIds,
            transitGatewayId: tgw.ref,
            vpcId: vpc.vpcId, //VPCのIDを設定します。
            options: {
                DnsSupport: "enable",
            },
            tags: [
                {
                key: "Name",
                value: "tgw-attach-vpc",
                },
            ],
            }
        );

        //----TgwのARN----
        const tgwArn = `arn:aws:ec2:${this.region}:${this.account}:transit-gateway/${tgw.ref}`;
        
        //----TgwArnをパラメーターストアに保存---
        new StringParameter(this, "TransitGwArn", {
            parameterName: "/transit-gw/arn",
            stringValue: tgwArn,
        });
        
        //TgwIdをパラメーターストアに保存する
        new StringParameter(this, "TransitGwId", {
            parameterName: "/transit-gw/id",
            stringValue: tgw.ref,
        });

        //出力
        new cdk.CfnOutput(this, "TransitGwArnOutput", {
            value: tgwArn,
            description: "Transit Gateway ARN",
        });

        new cdk.CfnOutput(this, "TransitGwIdOutput", {
            value: tgw.ref,
            description: "Transit Gateway ID",
        });



    };
}