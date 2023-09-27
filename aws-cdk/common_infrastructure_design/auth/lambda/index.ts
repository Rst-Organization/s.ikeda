import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import * as oracledb from "oracledb"



export const handler = async ( event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  const params = event.queryStringParameters ? event.queryStringParameters : {};

  const RESPONSE_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,access-token",
  };

  //SecretマネージャーからDBの認証情報を取得
  const seacretArn = process.env.DB_SECRET_ARN ?? "";
  //Secretmanagerのリージョンを指定
  const secretsManager = new AWS.SecretsManager({
    region: "ap-northeast-1",
  })
  //SecretマネージャーのARNを指定
  const seacretParams: AWS.SecretsManager.GetSecretValueRequest = {
    SecretId: seacretArn,
  };
  //Secretマネージャーから認証情報を取得し、ない場合はエラーを返す
  const response = await secretsManager.getSecretValue(seacretParams).promise();

  if (!response.SecretString) {
    return {
      statusCode: 404,
      headers: RESPONSE_HEADERS,
      body: JSON.stringify({ message: "Seacret Not found" }),
    };
  }

  //Secretを解析し、認証情報を取得
  const {username, password, host, port, dbname} = JSON.parse(response.SecretString)
  const connectString = `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${host})(PORT=${port}))(CONNECT_DATA=(SID=${dbname})))`;

  //DBに接続
  const connection = await oracledb.getConnection({
    user: username,
    password: password,
    connectionString: connectString, //ORACLEの接続文字列を環境変数から取得
  });

  const result = await connection.execute("SELECT * FROM users")
  await connection.close()

  return {
    statusCode: 200,
    headers: RESPONSE_HEADERS,
    body: JSON.stringify(result.rows)
  };
};