# DEVOPS環境CDK

## 概要
ここではDEVOPS環境のCDK構成について説明します。

この環境でのCDKはパイプライン作成の際に使用します。

## ディレクトリ概要
```
├── bin 
│     └── devops.ts #CDKのエントリポイント
├── lib
│     ├── AssumeRoleStack.ts #マルチアカウント用のIAMロールを作成するStack
│     ├── CodeCommit.ts #CodeCommitレポジトリを構築するStack
│     ├── EventBridgeStack.ts #CI/CDパイプラインに必要なEventBridgeルールを作成するStack
├── test
├── cdk.json # CDKの設定ファイル
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.json
└── jest.config.js
```

## Usage Process
https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/cli.html

* `npm ci`  - install node modules
* `npx cdk bootstrap`  - bootstrap the CDK app (only once)
* `npx cdk list`  - list all stacks in the app
* `npx cdk deploy <stack name>`  - deploy this stack to your default AWS account/region
* `npx cdk context --clear` clear CASH
* `npx cdk diff`  - compare deployed stack with current state
* `npx cdk synth`  - emits the synthesized CloudFormation template
* `npx cdk destroy`     - destroy the stack

## デプロイ方法
手順は[アプリ環境CDK手順](../common/README.md)の[パイプラインの作成手順](../common/README.md#パイプラインの作成手順)を参照してください。

---

＞ [アプリ環境のCDK手順](../common/README.md)

＞ [認証基盤のCDK手順](../auth/README.md)

＞ [コンソールからのパイプライン設定](../docs/02_pipeline_console_setup.md)

＞ [TOP](../README.md)