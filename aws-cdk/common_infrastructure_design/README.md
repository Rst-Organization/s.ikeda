# Common infrastructure design

## 概要
このリポジトリは`共通認証基盤`及び、`共通アプリ環境`のインフラ構築を管理するIACとドキュメントが格納されています。

IACは全て`AWS CDK (Typescript)`で記載しています。

### ディレクトリ概要
```
├── auth # 共通認証基盤IAC
├── common # 共通アプリ環境IAC
├── devops # DEVOPSアカウントIAC
├── docs # 各種ドキュメント
├── README.md
```

## 構築手順

### 事前準備

事前準備として以下のツールがインストール、設定が完了している必要があります。
- [AWS CLI](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-chap-install.html)
- [AWS CDK](https://docs.aws.amazon.com/ja_jp/cdk/latest/guide/getting_started.html)
- [CLIの認証設定](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-configure-files.html)
- Node.js 実行環境 (v18以上で動作確認済)

### 手順
1. [初期アカウントへのセキリュティ系サービスの有効化 ※まだ有効化されていない場合のみ](./docs/00_account_setup.md)

2. [CDKのセットアップとインフラ構成](./docs/01_cdk_setup.md)

3. 1と2が完了している場合は、各環境の構築手順を参照ください。
- [認証基盤環境のCDK手順](./auth/README.md)
- [アプリ環境のCDK手順](./common/README.md)
- [DEVOPS環境のCDK手順](./devops/README.md)
- [コンソールからのパイプライン作成方法](./docs/02_pipeline_console_setup.md)

## 備考
[Teamsチャンネル](https://teams.microsoft.com/l/team/19%3agKZPAG6v7giiELSPM2tb4giMzAoLeA75stjGesfM8aQ1%40thread.tacv2/conversations?groupId=f9f90e67-a190-4063-a160-3fc5e105b0f8&tenantId=1297339d-8ad9-484b-9a60-a39845f4ffb5)