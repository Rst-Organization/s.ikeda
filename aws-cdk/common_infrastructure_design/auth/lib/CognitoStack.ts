import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import * as lambda from "aws-cdk-lib/aws-lambda";

interface CognitoStackProps extends cdk.StackProps {
  deploymentStage: string;
}

export class CognitoStack extends cdk.Stack {  
  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id, props);

    const DEPLOYMENT_STAGE = props.deploymentStage || "stg";
    
    //パラメータストアから必要なLambdaのARNを取得する
    const lambdaArn = StringParameter.fromStringParameterAttributes(this, "LambdaArn", {
      parameterName: `/lambda/${DEPLOYMENT_STAGE}/cognitoTriggerLambdaArn`,
    }).stringValue;

    //LambdaArnからLambdaを取得する
    const lambdaTrigger = lambda.Function.fromFunctionArn(this, "LambdaFunction", lambdaArn);

    const userPool = new cognito.UserPool(this, "CognitoUserPool", {
      userPoolName: `cognite_${DEPLOYMENT_STAGE}_userpool`, // ユーザープール名
      passwordPolicy: {
        minLength: 8, // パスワードの最小文字数
        requireUppercase: false, //パスワードに大文字を含めるか
        requireLowercase: false, //パスワードに小文字を含めるか
        requireDigits: true, //パスワードに数字を含めるか
        requireSymbols: false, //パスワードに記号を含めるか
        tempPasswordValidity: cdk.Duration.days(7), //管理者が生成した一時パスワードの有効期間。デフォルトは7日
      },
      lambdaTriggers: {
        postConfirmation: lambdaTrigger,
      },
      selfSignUpEnabled: true, //セルフサービスサインアップの有効化
      autoVerify:{ email: true, phone: true }, //アシスト型の検証及び確認方法
      signInAliases: { phone: true }, //Cognitoユーザープールのサインイン
      standardAttributes: {
        birthdate : { required: true }, //必須属性( ユーザーの誕生日 )
        phoneNumber : { required: true }, //必須属性( ユーザーの電話番号 )
      },
      mfa: cognito.Mfa.REQUIRED, // ユーザーのMFA設定
      mfaSecondFactor: {
        sms: true, // SMSによるMFA設定
        otp: false, // OTPによるMFA設定
      },
      mfaMessage: "認証コードは {####} です。", // MFA認証メッセージテンプレート
      accountRecovery: cognito.AccountRecovery.NONE, // ユーザーアカウントの復旧設定 ( 管理者のみ )
      removalPolicy: cdk.RemovalPolicy.DESTROY, // cdk destroyでの削除設定　デフォルトは削除されない
    });

    // L1クラスへキャストする事で詳細設定を行う
    const cfnUserPool = userPool.node.defaultChild as cognito.CfnUserPool;
    //管理者招待メッセージテンプレート ({####}と{username}は必須})
    cfnUserPool.addPropertyOverride("AdminCreateUserConfig" , {
      InviteMessageTemplate: {
        EmailSubject: "【サンプル】ユーザー登録のご案内",
        EmailMessage: "ユーザーIDは{username}です。一時パスワードは「{####}」です。",
        SMSMessage: "ユーザーIDは{username}です。一時パスワードは「{####}」です。",
      },
    })
    // ユーザー登録メッセージテンプレート ({####}と{username}は必須})
    cfnUserPool.addPropertyOverride("VerificationMessageTemplate", {
      DefaultEmailOption: "CONFIRM_WITH_CODE",
      EmailSubject: "【サンプル】ユーザー登録のご案内",
      EmailMessage: "ユーザーIDは{username}です。一時パスワードは「{####}」です。",
      SmsMessage: "ユーザーIDは{username}です。一時パスワードは「{####}」です。",
    });


    // アプリケーションクライアントの設定
    userPool.addClient("ApplicationClient", {
      userPoolClientName: `cognito_${DEPLOYMENT_STAGE}_app`, // クライアント名
      accessTokenValidity: cdk.Duration.minutes(60), // アクセストークンの有効期間
      authSessionValidity: cdk.Duration.minutes(3), // 認証フローセッションの有効期間
      idTokenValidity: cdk.Duration.minutes(60), // IDトークンの有効期間
      refreshTokenValidity: cdk.Duration.minutes(43200), // 更新トークンの有効期間
      generateSecret: false, // シークレットの作成設定
      enableTokenRevocation: true, // 高度な認証設定のトークンの取り消しを有効化
      preventUserExistenceErrors: true, // 高度な認証設定のユーザー存在エラーの防止を有効化
      authFlows: { // 認証フロー設定
        userPassword: true, // ユーザー名とパスワード
        adminUserPassword: true, // 管理者ユーザー名とパスワード
        userSrp: false, // ユーザー名とパスワードを使用したSRP認証
        custom: false, // カスタム認証フロー
      },
      oAuth: {
        flows: { // OAuth 付与タイプ設定
          authorizationCodeGrant: true, // 認証コード付与
        },
        // 許可されているコールバックURL設定
        callbackUrls: [
          "https://oauth.pstmn.io/v1/callback", // ポストマン用
        ],
        // 許可されているサインアウトURL設定
        logoutUrls: [],
        //OAuthスコープ設定
        scopes: [cognito.OAuthScope.PHONE],
      },
    });
    
    //CognitoUerPoolのArnをパラメータストアに保存します。
    new StringParameter(this, `${DEPLOYMENT_STAGE}CognitoUserPoolArn`, {
      parameterName: `/cognito/${DEPLOYMENT_STAGE}/CognitoUserPoolArn`,
      stringValue: userPool.userPoolArn,
    });


  };
}