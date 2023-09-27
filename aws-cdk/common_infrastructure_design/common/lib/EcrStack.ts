import * as cdk from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";

interface MyErcStackProps extends cdk.StackProps {
  deploymentStage: string;
  projectName: string;
}

export class MyErcStack extends cdk.Stack {

  public readonly EcrRepositoryArn: string;

  constructor(scope: Construct, id: string, props: MyErcStackProps) {
    super(scope, id, props);
    const DEPLOYMENT_STAGE = props?.deploymentStage || "stg";
    const PROJECT_NAME = props?.projectName || "Myapp";

    // -----ECRレポジトリの作成-----
    const EcrRepository = new ecr.Repository(this, "Repository", {
      repositoryName: `${DEPLOYMENT_STAGE}-${PROJECT_NAME}-repo`,
      removalPolicy: cdk.RemovalPolicy.DESTROY, //スタック削除時にECRも削除する DESTROY/RETAIN
      autoDeleteImages: true
    });

    new cdk.CfnOutput(this, "EcrArn", {
      value: EcrRepository.repositoryArn,
      exportName: "EcrArn"
    })

    new cdk.CfnOutput(this, "EcrUri", {
      value: EcrRepository.repositoryUri,
      exportName: "EcrUri"
    })

    this.EcrRepositoryArn = EcrRepository.repositoryArn;

  };
}
