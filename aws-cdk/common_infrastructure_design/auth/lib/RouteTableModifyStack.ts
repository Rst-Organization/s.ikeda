import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { StringParameter, StringListParameter } from "aws-cdk-lib/aws-ssm";

interface RouteTableModifyStackProps extends cdk.StackProps {
    deploymentStage: string;
    targetCidrBlocks: string[];
}

export class RouteTableModifyStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: RouteTableModifyStackProps) {
        super(scope, id, props);

        const DEPLOYMENT_STAGE = props?.deploymentStage || 'stg';
        const CidrBlocks: string[] = props.targetCidrBlocks || [];

        // Transit Gateway IDをパラメータストアから取得します。
        const tgwId: string = StringParameter.valueForStringParameter(this, "/transit-gw/id");

        // VPCプライベートサブネットのルートテーブルIDをパラメータストアから取得します。※.split(",")未対応らしく正規な方法で取り出す必要がある
        const RouteTableParamas: string[] = StringListParameter.valueForTypedListParameter(this,
            `/vpc/${DEPLOYMENT_STAGE}/PrivateSubnetRouteTableIdList`);

        // パラメータストアから取得したトークンから値を取り出します
        const privateSubnetRtIds: string[] = [ cdk.Fn.select(0,RouteTableParamas), cdk.Fn.select(1,RouteTableParamas) ];

        // プライベートサブネットに対して、Transit Gateway及び、別VPCへのルーティングを作成します。
        privateSubnetRtIds.forEach((subnetRtId,index) => {
            const routeTableName = `${DEPLOYMENT_STAGE}-vpc-a-rtb-${index}`;

            //Transit Gatewayへのルートを作成します。
            CidrBlocks.forEach((CidrBlock, blockIndex ) => {
                new ec2.CfnRoute(this, `${routeTableName}-route-to-Transit-Gateway-${blockIndex}`, {
                    routeTableId: subnetRtId, //サブネットのルートテーブルIDを設定します。
                    destinationCidrBlock: CidrBlock, //宛先CIDRブロックを設定します。(宛先VPCのCIDRブロック)
                    transitGatewayId: tgwId, //Transit GatewayのIDを設定します。
                });
            });
            
        });
        

    };
}