from aws_cdk import (
    Duration,
    Stack,
    aws_sqs as sqs,
    aws_s3 as s3,
    aws_s3_notifications,
    aws_lambda as lambda_,
    aws_apigateway as apigw_,
    aws_dynamodb as dynamodb_,
    aws_lambda_python_alpha as python_function,
    aws_iam as iam,
)
from constructs import Construct

class CdkEmbedLambdaStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, openai_key, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # The code that defines your stack goes here

        # example resource
        input_bucket = s3.Bucket(self, "CdkEmbedLambdaInputBucket")
        bucket = s3.Bucket(self, "CdkEmbedLambdaBucket")

        # lambda layer
        # layer = python_function.PythonLayerVersion(self, "CdkEmbedLambdaLayer",
        #     entry="cdk_embed_lambda/layers",
        #     compatible_runtimes=[lambda_.Runtime.PYTHON_3_10],
        #     layer_version_name="CdkEmbedLambdaLayer",
        # )

        lambda_function = lambda_.DockerImageFunction(self, "CdkEmbedLambdaFunction",
            code=lambda_.DockerImageCode.from_image_asset(directory=".build/embed_lambda"),
            environment={
                "S3_BUCKET": bucket.bucket_name,
                "OPENAI_KEY": openai_key,
            },
            timeout=Duration.seconds(420),
            memory_size=1024,
            architecture=lambda_.Architecture.X86_64,
        )

        notification = aws_s3_notifications.LambdaDestination(lambda_function)

        # S3トリガー
        input_bucket.add_event_notification(s3.EventType.OBJECT_CREATED, notification)

        # LambdaにS3バケットの読み取り書き込み権限を付与
        input_bucket.grant_read_write(lambda_function)
        bucket.grant_read_write(lambda_function)
        lambda_function.add_to_role_policy(
            iam.PolicyStatement(
                resources=["*"],
                actions=["s3:*"],
            )
        )

        ans_lombda = lambda_.DockerImageFunction(self, "CdkEmbedLambdaAnsFunction",
            code=lambda_.DockerImageCode.from_image_asset(directory=".build/ans_lambda"),
            environment={
                "S3_BUCKET": bucket.bucket_name,
                "OPENAI_KEY": openai_key,
            },
            timeout=Duration.seconds(420),
            memory_size=1024,
            architecture=lambda_.Architecture.X86_64,
        )
        bucket.grant_read_write(ans_lombda)
        ans_lombda.add_to_role_policy(
            iam.PolicyStatement(
                resources=["*"],
                actions=["s3:*"],
            )
        )

        # apigate way
        api = apigw_.LambdaRestApi(self, "CdkEmbedLambdaApi",
            handler=ans_lombda,
            proxy=False,
        )

        api.root.add_resource("chat").add_method("POST")

        # queue = sqs.Queue(
        #     self, "CdkEmbedLambdaQueue",
        #     visibility_timeout=Duration.seconds(300),
        # )
