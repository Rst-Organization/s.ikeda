import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origin from "aws-cdk-lib/aws-cloudfront-origins";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

//-- CloudFrontの設定 (APIGatewayをOriginにディストリビューションを作成。他の設定を確認) ----

interface CloudfrontStackProps extends cdk.StackProps {
    deploymentStage: string;
    restApi: apigw.RestApi;
}

export class CloudfrontStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: CloudfrontStackProps) {
        super(scope, id, props);

        const commonDistribution = new cloudfront.Distribution(this, "LambdaDistribution", {
            defaultBehavior: {
                origin: new origin.RestApiOrigin(props.restApi),
                cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
            },
        });


    }
}