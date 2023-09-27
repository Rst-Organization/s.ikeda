import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

interface ResourceAccessManagerStackProps extends cdk.StackProps {
    deploymentStage: string;
    TargetAwsAccount: string[];
}

export class ResourceAccessManagerStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ResourceAccessManagerStackProps) {
        super(scope, id, props);

        const DEPLOYMENT_STAGE = props?.deploymentStage || 'stg';
        const TARGET_AWSACCOUNT = props.TargetAwsAccount;

        //パラメータストアから値を取得
        const tgwArn = StringParameter.valueForStringParameter(this, "/transit-gw/arn");


        //TransitGwリソース共有
        const ramResourceShare = new cdk.aws_ram.CfnResourceShare(this, "Resource Share", {
            name: `${DEPLOYMENT_STAGE}-transit-gw-share`,
            allowExternalPrincipals: true,
            principals: TARGET_AWSACCOUNT, //共有先のAWSアカウントID
            resourceArns: [tgwArn],
        });


    };
}