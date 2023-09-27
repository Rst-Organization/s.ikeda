import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';

import createDataBase from './resource/createDataBase';
import createEcsFargate from './resource/createEcsfargate';

interface AppBaseStackProps extends StackProps {
    deploymentStage: string,
    projectName: string,
    ecrRepositoryArn: string;
}

export class AppBaseStack extends Stack {

  public readonly fargateService: ecsPatterns.ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props: AppBaseStackProps) {
    super(scope, id, props);

    const DEPLOYMENT_STAGE = props?.deploymentStage || 'stg';
    const PROJECT_NAME = props?.projectName || 'myApp';
    const ecrRepositoryArn = props.ecrRepositoryArn || '';

    // ------DB作成-----------
    const databaseCredentialsSecretArn = createDataBase(this, DEPLOYMENT_STAGE, PROJECT_NAME);
    // ------ECS作成-----------
    this.fargateService = createEcsFargate(this, 
        DEPLOYMENT_STAGE, 
        PROJECT_NAME, 
        ecrRepositoryArn, 
        databaseCredentialsSecretArn,
    );

  };
}