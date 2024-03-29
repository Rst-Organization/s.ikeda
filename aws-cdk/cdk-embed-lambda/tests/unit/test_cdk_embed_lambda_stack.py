import aws_cdk as core
import aws_cdk.assertions as assertions

from cdk_embed_lambda.cdk_embed_lambda_stack import CdkEmbedLambdaStack

# example tests. To run these tests, uncomment this file along with the example
# resource in cdk_embed_lambda/cdk_embed_lambda_stack.py
def test_sqs_queue_created():
    app = core.App()
    stack = CdkEmbedLambdaStack(app, "cdk-embed-lambda")
    template = assertions.Template.from_stack(stack)

#     template.has_resource_properties("AWS::SQS::Queue", {
#         "VisibilityTimeout": 300
#     })
