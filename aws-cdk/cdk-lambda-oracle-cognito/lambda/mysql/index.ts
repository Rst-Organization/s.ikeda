import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import * as mysql from "mysql2/promise"

/*RDSへの接続をSSLで行う場合には以下の証明書の内容を記載する
https://www.amazontrust.com/repository/AmazonRootCA1.pem
*/
const cert = `
-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
rqXRfboQnoZsG4q5WTP468SQvvG5
-----END CERTIFICATE-----
`.trim()



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
  const {username, password} = JSON.parse(response.SecretString)

  //MySQLに接続 (RDS Proxy経由)
  const connection = await mysql.createConnection({
    host: process.env.PROXY_ENDPOINT, //RDS Proxyのエンドポイント
    user: username,
    password: password,
    database: 'app',
    port: 3306,
    ssl: {
      cert: cert
    }
  });

  const result = await connection.query("select * from user")

  return {
    statusCode: 200,
    headers: RESPONSE_HEADERS,
    body: JSON.stringify(result[0])
  };
};