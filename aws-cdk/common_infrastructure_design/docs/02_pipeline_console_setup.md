# コンソールからパイプラインを作成する方法

## はじめに
CDKを用いる事なく、コンソールからマルチアカウントのパイプラインを作成する方法を記載します。

手順では**本番環境**、**テスト環境**、**DEVOPS環境(CodeCommitのあるアカウント)** の3つで構成してます。
あくまでも、参考例となりますので適宜変更してください。

### 前提条件
- 本番環境とテスト環境にECSとECRがプロビジョニング済みである事
- DEVOPS環境にCodeCommitリポジトリが作成済みである事

### 全体手順

- 本番環境アカウント
  - CodeBuildで使用するIAMロールを作成
  - CodePipelineで使用するIAMロールを作成
  - KMSキー、S3アーティファクトバケットを作成
  - CodePipelineを作成
  - EventBridgeを作成

- テスト環境アカウント
  - CodeBuildで使用するIAMロールを作成
  - CodePipelineで使用するIAMロールを作成
  - KMSキー、S3アーティファクトバケットを作成
  - CodePipelineを作成
  - EventBridgeを作成

- DEVOPS環境アカウント
  - AssumRoleできるIAMロールを作成
  - EventBridgeを作成


## 本番環境アカウントでの作業
### ① CodeBuildで使用するIAMロールを作成します。

信頼ポリシー
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "codebuild.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```
許可ポリシー
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "CloudWatchLogsPolicy",
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Sid": "S3ObjectPolicy",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Sid": "ECRPowerUserPolicy",
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:GetRepositoryPolicy",
                "ecr:DescribeRepositories",
                "ecr:ListImages",
                "ecr:DescribeImages",
                "ecr:BatchGetImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:PutImage"
            ],
            "Resource": "*"
        }
    ]
}
```

### ② CodePipelineで使用するポリシーを作成します。

信頼ポリシー
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "codepipeline.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```
許可ポリシー
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AssumeRolePolicy",
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": [
                "arn:aws:iam::<DEVOPS環境のAWSアカウント>:role/*"
            ]
        },
        {
            "Sid": "S3Policy",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:GetBucketVersioning"
            ],
            "Resource": "*",
            "Effect": "Allow"
        },
        {
            "Sid": "CodeBuildPolicy",
            "Action": [
                "codebuild:BatchGetBuilds",
                "codebuild:StartBuild"
            ],
            "Resource": "*",
            "Effect": "Allow"
        },
        {
            "Sid": "ECSPolicy",
            "Action": [
                "ecs:DescribeServices",
                "ecs:DescribeTaskDefinition",
                "ecs:DescribeTasks",
                "ecs:ListTasks",
                "ecs:RegisterTaskDefinition",
                "ecs:UpdateService",
                "iam:PassRole"
            ],
            "Resource": "*",
            "Effect": "Allow"
        }
    ]
}
```

### ③ S3でアーティファクトを格納するバケットを作成します。
バケットポリシー例
```json
{
  "Version": "2012-10-17",
  "Id": "SSEAndSSLPolicy",
  "Statement": [
    {
      "Sid": "DenyUnEncryptedObjectUploads",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::<アーティファクトバケットの名前>/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "aws:kms"
        }
      }
    },
    {
      "Sid": "DenyInsecureConnections",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::<アーティファクトバケットの名前>/*",
      "Condition": {
        "Bool": {
          "aws:SecureTransport": false
        }
      }
    },
    {
      "Sid": "CrossAccountS3GetPutPolicy",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<DEVOPS環境のAWSアカウント>:root"
      },
      "Action": [
        "s3:Get*",
        "s3:Put*"
      ],
      "Resource": "arn:aws:s3:::<アーティファクトバケットの名前>/*"
    },
    {
      "Sid": "CrossAccountS3ListPolicy",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<DEVOPS環境のAWSアカウント>:root"
      },
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::<アーティファクトバケットの名前>"
    }
  ]
}
```
### ④ KMSを作成します。
**パイプラインを設置する同じリージョンに作成します**

暗号化キーのポリシー例
```json
{
  "Version": "2012-10-17",
  "Id": "key-policy-name",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<本番環境のAWSアカウント>:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow access for Key Administrators",
      "Effect": "Allow",
      "Principal": {
        "AWS": "<KMSの暗号化キーの管理ユーザのARN>"
      },
      "Action": [
        "kms:Create*",
        "kms:Describe*",
        "kms:Enable*",
        "kms:List*",
        "kms:Put*",
        "kms:Update*",
        "kms:Revoke*",
        "kms:Disable*",
        "kms:Get*",
        "kms:Delete*",
        "kms:TagResource",
        "kms:UntagResource",
        "kms:ScheduleKeyDeletion",
        "kms:CancelKeyDeletion"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Allow use of the key",
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "<CodeBuildのサービスロールARN>",
          "<CodePipelineのサービスロールARN>",
          "arn:aws:iam::<DEVOPS環境のAWSアカウント>:root"
        ]
      },
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:DescribeKey"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Allow attachment of persistent resources",
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "<CodeBuildのサービスロールのARN>",
          "<CodePipelineのサービスロールのARN>",
          "arn:aws:iam::<DEVOPS環境のAWSアカウント>:root"
        ]
      },
      "Action": [
        "kms:CreateGrant",
        "kms:ListGrants",
        "kms:RevokeGrant"
      ],
      "Resource": "*",
      "Condition": {
        "Bool": {
          "kms:GrantIsForAWSResource": "true"
        }
      }
    }
  ]
}
```

ここまでで作成したアーティファクトバケットとKMSのARNをメモしておきます。

※①~④の作業をCDK化したものが、`common/lib/PipelineResourceStack.ts`です。


## テスト環境アカウントでの作業

本番環境アカウントでおこなった①~④と同一の作業をおこないます。

作成したアーティファクトバケットとKMSのARNをメモしておきます。

## DEVOPS環境アカウントでの作業
### 本番、テストの環境へAssumeRoleする為のIAMロールを作成します。

信頼ポリシー
```json
{
		"Version": "2012-10-17",
		"Statement": [
		{
			"Effect": "Allow",
			"Principal": {
			"AWS": [
								"arn:aws:iam::<本番環境AWSアカウント>:root",
								"arn:aws:iam::<テスト環境AWSアカウント>:root"
							]
			},
			"Action": "sts:AssumeRole",
			"Condition": {}
    }
  ]
}
```

許可ポリシー
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "UploadArtifactPolicy",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl"
            ],
            "Resource": [
                "<本番環境のアーティファクトバケットのARN>/*",
                "<テスト環境のアーティファクトバケットのARN>/*"
            ]
        },
        {
            "Sid": "KMSAccessPolicy"
            "Effect": "Allow",
            "Action": [
                "kms:DescribeKey",
                "kms:GenerateDataKey*",
                "kms:Encrypt",
                "kms:ReEncrypt*",
                "kms:Decrypt"
            ],
            "Resource": [
                "<本番環境のKMSキーのARN>",
                "<テスト環境のKMSキーのARN>"
            ]
        },
        {
            "Sid": "CodeCommitAccessPolicy",
            "Effect": "Allow",
            "Action": [
                "codecommit:GetBranch",
                "codecommit:GetCommit",
                "codecommit:UploadArchive",
                "codecommit:GetUploadArchiveStatus",
                "codecommit:CancelUploadArchive"
            ],
            "Resource": [
                "<CodeCommitリポジトリのARN>"
            ]
        }
    ]
}
```
※CodeCommitレポジトリのARNは `aws codecommit get-repository --repository-name <RepoName>` で確認できます。

## CI/CDパイプラインの作成

### 本番環境アカウントでの作業

#### ① CLIからビルドプロジェクトを作成します。

a. 以下の定義ファイルを参考に必要箇所を変更し、定義ファイルを作成します。

[`docs/definition_files/codebuild.json`](definition_files/codebuild.json)

  - [ビルド環境のコンピューティングタイプ](https://docs.aws.amazon.com/ja_jp/codebuild/latest/userguide/build-env-ref-compute-types.html)

  - [CodeBuildに用意されているDockerイメージ](https://docs.aws.amazon.com/ja_jp/codebuild/latest/userguide/build-env-ref-available.html)

  - [CodeBuild のビルド仕様に関するリファレンス](https://docs.aws.amazon.com/ja_jp/codebuild/latest/userguide/build-spec-ref.html)
    - [テスト用YAMLファイル](./definition_files/buildspec_docker.yml)


b. ビルドプロジェクトを新規作成します。
```bash
aws codebuild create-project --cli-input-json file://codebuild.json
```

c. ビルドプロジェクトを更新する際は以下のコマンドを実行します。
```bash
aws codebuild update-project --cli-input-json file://codebuild.json
```

#### ② CLIからパイプラインを作成します。

a. 以下の定義ファイルを参考に必要箇所を変更し、定義ファイルを作成します。

[`docs/definition_files/codepipeline.json`](definition_files/codepipeline.json)

b. パイプラインを新規作成します。
```bash
aws codepipeline create-pipeline --cli-input-json file://codepipeline.json
```

c. パイプラインを更新する際は以下のコマンドを実行します。
```bash
aws codepipeline update-pipeline --cli-input-json file://codepipeline.json
```

#### ③ パイプラインが作成されたら、CodePipelineのコンソールからパイプラインを手動実行し、正しく動作するか確認します。

### テスト環境での作業

本番環境同様、①~③の手順を実施します。

## EventBridgeの作成

### 本番環境での作業

#### ① イベントバス `default` の検出を開始します。

#### ② `アクセス許可の管理` からリソースベースのポリシーを追加します。
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowAccountToPutEvents",
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::<DEVOPS環境のAWSアカウント>:root"
    },
    "Action": "events:PutEvents",
    "Resource": "arn:aws:events:ap-northeast-1:<本番環境のAWSアカウント>:event-bus/default"
  }]
}
```

イベントバスのARNをメモしておきます。

#### ③ イベントルールの作成を行います。
イベントパターン
```json
{
  "source": ["aws.codecommit"],
  "detail-type": ["CodeCommit Repository State Change"],
  "resources": ["<CodeCommitレポジトリのARN>"],
  "detail": {
    "event": ["referenceUpdated", "referenceCreated"],
    "referenceName": ["<ブランチ名> 例:main"]
  }
}
```
ターゲット
- タイプ: `codepipeline`
- ターゲット名: `本番環境のパイプラインARN`
- 入力: `一致したイベント`
- ロール: `新しく作成`

ロールを新しく作成すると以下のポリシーが割当たります。

信頼ポリシー
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "events.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```
許可ポリシー
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "codepipeline:StartPipelineExecution"
            ],
            "Resource": [
                "<本番環境のパイプラインARN>"
            ]
        }
    ]
}
```

### テスト環境での作業

本番環境同様に①~③の手順を実施します。

### DEVOPS環境での作業

#### ① イベントルールの作成

イベントパターン
```json
{
  "source": ["aws.codecommit"],
  "detail-type": ["CodeCommit Repository State Change"],
  "resources": ["<CodeCommitレポジトリのARN>"],
  "detail": {
    "event": ["referenceUpdated", "referenceCreated"],
    "referenceName": ["<ブランチ名 例:main>"]
  }
}
```

ターゲットタイプ
- EventBridgeイベントバス: `別のアカウントまたはリージョンのイベントバス`
- ターゲット名: `本番環境のイベントバスARN`
- ロール: `新しく作成`

同様にテスト環境用も作成します。

※ ここまでの手順をまとめたCDKが、`common/lib/PipelineStack.ts` です。

---
＞ 　[TOP](../README.md)

＞　[共通認証基盤](../auth/README.md)

＞　[アプリ環境](../common/README.md)

＞　[DEVOPSアカウント](../devops/README.md)


