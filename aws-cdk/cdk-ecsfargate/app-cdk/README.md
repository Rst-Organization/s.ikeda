# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## このCDKで作られるリソース
- GitHubをレポジトリとしてCodePipeline - ECS Fargateのデプロイ
- ステージング、運用環境の2面を作成し、手動認証で運用環境へのビルドが走るようにする

## 参考
[CI/CDハンズオン]https://catalog.workshops.aws/cicdonaws/ja-JP
[マルチアカウントでのCodePipelineを使ったCI/CDの構築](https://qiita.com/sugimount-a/items/540d130fe7cfea15bf13)
