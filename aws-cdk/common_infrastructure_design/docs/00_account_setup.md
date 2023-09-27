# 初期アカウントへのセキリュティ系サービスの有効化

新しいAWSアカウントへ環境を作成する場合、以下のセキリュティサービスは有効化しておく必要があります。

なお、既に有効化されている場合は、この手順は不要です。


## AWS Config
※ContorlTowerで有効化済みの場合は不要。
  - 以下の1クリックセットアップ手順で有効化します。
  - https://docs.aws.amazon.com/ja_jp/config/latest/developerguide/1-click-setup.html
    - アクセス許可の不足とエラーが出る場合はControlTowerで制限されておりますので管理者へお問い合わせください。 


## Aws Inspector
※ContorlTowerで有効化済みの場合は不要。
  - 以下手順を参考にアクティベート化を行います。
  - https://docs.aws.amazon.com/ja_jp/inspector/latest/user/getting_started_tutorial.html#tutorial_activate_scans

  - 若しくは以下のCLIコマンドでの有効化も可能です。

```bash
aws inspector2 enable \
--region "ap-northeast-1" \
--resource-types EC2 ECR LAMBDA LAMBDA_CODE \
--profile <ProfileName>
```


## AWS GuardDuty
※ContorlTowerで有効化済みの場合は不要。
- 以下の手順を参考に有効化を行います。
- https://docs.aws.amazon.com/ja_jp/guardduty/latest/ug/guardduty_settingup.html#guardduty_enable-gd

- 若しくは以下のCLIコマンドでの有効化も可能です。

```bash
aws guardduty create-detector \
--enable --region "ap-northeast-1" \
--profile <ProfileName>
```


## AWS Security Hub
※ContorlTowerで有効化済みの場合は不要。
- 以下の手順を参考に有効化を行います。
- https://docs.aws.amazon.com/ja_jp/securityhub/latest/userguide/securityhub-enable.html

- 若しくは以下のCLIコマンドでの有効化も可能です。

```bash
aws securityhub enable-security-hub \
--enable-default-standards \
--region "ap-northeast-1" \
--profile <ProfileName>
```


---

上記の有効化が完了したら、次に進みます。

＞ [CDKのセットアップとインフラ構成](./01_cdk_setup.md)

＞ [TOP](../README.md)



