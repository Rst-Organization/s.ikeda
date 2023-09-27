import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class MainStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /* defines a Cognito -----------------------------------------
    https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito.UserPool.html
    */

    const UserPool = new cognito.UserPool(this, 'Sample-users-pool', {
      userPoolName: 'sample-users', // ユーザープール名
      selfSignUpEnabled: true, // セルフサービスのサインアップ設定
      signInAliases: { email: true }, // Cognito ユーザープールのサインイン
      standardAttributes: {
        givenName: { required: true }, // 必須の属性
        familyName: { required: true },
      },
      customAttributes: { // カスタム属性設定
        'family_name_kana': new cognito.StringAttribute({ minLen: 1, maxLen: 256, mutable: true }),
        'given_name_kana': new cognito.StringAttribute({ minLen: 1, maxLen: 256, mutable: true }),
      },
      passwordPolicy: { // 設定しない場合はコンソールの場合と同じデフォルト設定
        minLength: 10,
        requireLowercase: false,
        requireUppercase: false,
        requireDigits: false,
        requireSymbols: false,
        tempPasswordValidity: cdk.Duration.days(7),
      },
    //   lambdaTriggers: {
    //     postConfirmation: , // 今回は登録確認後のトリガー設定　他も有り
    //   },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY, // ユーザーアカウントの復旧設定
      removalPolicy: cdk.RemovalPolicy.DESTROY, // cdk destroyでの削除設定　デフォルトは削除されない
    });

    //　今回は設定しなかったがCoginitoドメイン設定とカスタムドメイン設定は以下
    // ドメイン設定や証明書設定（バージニア北部）のからみで一部手作業にしたため

    // UserPool.addDomain('MSample-users-domain', {
    //   cognitoDomain: {
    //     domainPrefix: 'sample-users',
    //   },
    //   customDomain: {
    //     domainName: 'auth.sample.com',
    //     certificate: domainCert,　// これは仮の変数で中身はCertigicatManager　module
    //   }
    // });

    // アプリケーションクライアントの設定
    UserPool.addClient('Application', {
      userPoolClientName: 'application', // クライアント名
      generateSecret: false, // シークレットの作成設定
      enableTokenRevocation: true, // 高度な認証設定のトークンの取り消しを有効化
      preventUserExistenceErrors: true, // 高度な認証設定のユーザー存在エラーの防止を有効化
      oAuth: {
        flows: { // OAuth 付与タイプ設定
          authorizationCodeGrant: true, // 認証コード付与
          implicitCodeGrant: true, // 暗黙的な付与
        },
        callbackUrls: [ // 許可されているコールバックURL設定
          'https://sample.com/app',
          'https://oauth.pstmn.io/v1/callback', // ポストマンアプリ用
        ],
        logoutUrls: [ // 許可されているサインアウトURL設定
          'https://sample.com/app',
        ],
        scopes: [ // カスタムスコープ
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PHONE,
          cognito.OAuthScope.PROFILE,
        ],
      }
    });
  }
}