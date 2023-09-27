import * as cdk from 'aws-cdk-lib';
import * as ecr from "aws-cdk-lib/aws-ecr";
import { Construct } from 'constructs';


export class MyErcStack extends cdk.Stack {
  public readonly lambdaEcrRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // -----ECRレポジトリの作成-----
    this.lambdaEcrRepository = new ecr.Repository(this, 'Repository', {
      repositoryName: `${id}-repo`,
      removalPolicy: cdk.RemovalPolicy.DESTROY, //スタック削除時にECRも削除する DESTROY/RETAIN
      autoDeleteImages: true
    });
  }
}