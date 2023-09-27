import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import createCognitoTrigeerLambda from "./resource/createCognitoTrigeerLambda";
import createGetDbLambda from "./resource/createGetDbLambda";
import createPutDbLambda from "./resource/createPutDbLambda";


interface LambdaStackProps extends cdk.StackProps {
    deploymentStage: string;
    CustomLyerArn: string;
}

export class LambdaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props);

        const DEPLOYMENT_STAGE = props.deploymentStage || 'stg';
        const CustomLyerArn = props.CustomLyerArn;

        // -------Lambda-----------
        const CreateLambdaTrigger = createCognitoTrigeerLambda(this, DEPLOYMENT_STAGE, CustomLyerArn);

        const CreateGetDbLambda = createGetDbLambda(this, DEPLOYMENT_STAGE, CustomLyerArn);

        const CreatePutDbLambda = createPutDbLambda(this, DEPLOYMENT_STAGE, CustomLyerArn);

  };
}