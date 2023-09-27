import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { StringParameter, StringListParameter } from "aws-cdk-lib/aws-ssm";

interface TransitGatewayAttachmentProps extends cdk.StackProps {
    deploymentStage: string;
    projectName: string;
    tgwId: string;
    routeIp: string;
}

export class TransitGatewayAttachmentStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: TransitGatewayAttachmentProps) {
        super(scope, id, props);

        const DEPLOYMENT_STAGE = props?.deploymentStage || 'stg';
        const PROJECT_NAME = props?.projectName || 'Myapp';
        const tgwId: string = props.tgwId;
        const routeIp: string = props.routeIp;

        // VPCのIDをパラメータストアから取得します。
        const vpcId: string = StringParameter.valueForStringParameter(this,
            `/vpc/${DEPLOYMENT_STAGE}-${PROJECT_NAME}/VpcId`);

        // TGWサブネットのIDをパラメータストアから取得します。※.split(",")未対応らしく正規な方法で取り出す必要がある
        const SubnetParamas: string[] = StringListParameter.valueForTypedListParameter(this,
            `/vpc/${DEPLOYMENT_STAGE}-${PROJECT_NAME}/TgwAttachmentSubnetIdList`);
        
        // パラメータストアから取得したトークンから値を取り出します
        const transitGatewaySubnetIds: string[] = [ cdk.Fn.select(0,SubnetParamas), cdk.Fn.select(1,SubnetParamas) ];
    
    // ----Transit Gateway を専用サブネットへアタッチ -----
        const tgwVpcAttachment = new ec2.CfnTransitGatewayVpcAttachment(this, "Transit Gateway attachment VPC", {
            subnetIds: transitGatewaySubnetIds, //Transit GatewayにアタッチするサブネットIDを設定します。
                transitGatewayId: tgwId, //Transit GatewayのIDを設定します。
                vpcId: vpcId,
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

    // ----TransitGatewayと接続するサブネットのルートテーブルにルートを追加。----
        const privateSubnetRouteTable: string[] = StringListParameter.valueForTypedListParameter(this,
            `/vpc/${DEPLOYMENT_STAGE}-${PROJECT_NAME}/PrivateSubnetRouteTableIdList`);
        
        const privateSubnetRouteTableIds: string[] = [ cdk.Fn.select(0,privateSubnetRouteTable), cdk.Fn.select(1,privateSubnetRouteTable) ];

        privateSubnetRouteTableIds.forEach((subnetId, index) => {
            const routeTableName = `vpc-rtb-private-${index}`;
            //Transit Gatewayへのルートを作成します。
            new cdk.aws_ec2.CfnRoute(
            this,
            `${routeTableName} route to Transit Gateway`,
            {
                routeTableId: subnetId, //サブネットのルートテーブルIDを設定します。
                destinationCidrBlock: routeIp, //宛先CIDRブロックを設定します。
                transitGatewayId: tgwId, //Transit GatewayのIDを設定します。
            }
            ).addDependsOn(tgwVpcAttachment); //Transit Gateway attachmentが完了してから実行する。
        });


    };
}