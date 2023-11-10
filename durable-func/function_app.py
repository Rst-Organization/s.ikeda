import azure.functions as func
import azure.durable_functions as df

import openai
import os
import base64
import json
from linebot import LineBotApi
from linebot.models import TextSendMessage, ImageSendMessage

from io import StringIO
import logging
from typing import Dict
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential

myApp = df.DFApp(http_auth_level=func.AuthLevel.ANONYMOUS)

line_bot_api = LineBotApi('+KURRWoIegRS4YbCsKliMdolgrwgMH3ngTW1oMt83rMYmd23gg4WNs3tH9028bTVOtjxDPYm+6SlKI+IiQnhBXZ4gMkAwFFvspMS/enhLwrPCwupB6MIybpLp1medcFUjbHqwW7S7onpfZ5I+NyRNwdB04t89/1O/w1cDnyilFU=')

# An HTTP-Triggered Function with a Durable Functions Client binding
@myApp.route(route="orchestrators/{functionName}")
@myApp.durable_client_input(client_name="client")
async def http_start(req: func.HttpRequest, client):
    function_name = req.route_params.get('functionName')
    instance_id = await client.start_new(function_name)
    response = client.create_check_status_response(req, instance_id)
    return response

# An Webhook-Triggered
@myApp.route(route="webhook", methods=["POST"])
@myApp.durable_client_input(client_name="client")
async def line_webhook(req: func.HttpRequest, client):
    body = req.get_json()
    for event in body['events']:
        if event['type'] == 'message':
            if event['message']['type'] == 'text':

                message = event['message']['text']
                user_id = event['source']['userId']

                instance_id = await client.start_new("hello_orchestrator", None, {"message": message, "user_id": user_id})

                line_bot_api.reply_message(
                    event['replyToken'],
                    TextSendMessage(text=event['message']['text'])
                )
                response = client.create_check_status_response(req, instance_id)
                return response
    
    return func.HttpResponse("OK", status_code=200)


# Orchestrator
@myApp.orchestration_trigger(context_name="context")
def hello_orchestrator(context):
    input_data = context.get_input()
    message = input_data["message"]
    user_id = input_data["user_id"]

    is_negative = yield context.call_activity("text_analyzer", message)
    if is_negative == False:
        line_bot_api.push_message(
            user_id,
            TextSendMessage(text="愚痴を言え。愚痴を。")
        )
        return "Done"

    image_url = yield context.call_activity("create_image", message)

    line_bot_api.push_message(
        user_id,
        ImageSendMessage(original_content_url=image_url, preview_image_url=image_url)
    )

    return "Done"

# Activity
@myApp.activity_trigger(input_name="message")
def text_analyzer(message: str) -> bool:
    sentiment = TextSentimentAnalyzer().analyze_sentiment(message)
    print('sentiment:' + sentiment)
    if sentiment == "positive":
        return False
    else:
        return True


# Activity - Create Image
@myApp.activity_trigger(input_name="message")
def create_image(message: str):

    NUMBER_OF_IMAGES = 1
    openai.api_key = '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'

    response = openai.Image.create(
        prompt=message,
        n=NUMBER_OF_IMAGES,
        size="512x512",
        response_format="url",
    )
    image_url = response['data'][0]['url']

    return image_url

# Class TextAnalyzer
class TextSentimentAnalyzer:
    def __init__(self):
        self.endpoint = "https://defolt-text-analytics.cognitiveservices.azure.com/"
        self.key = "62442117aa65403da60038b1d67ef940"
        self.client = self.authenticate_client()

    def authenticate_client(self):
        ta_credential = AzureKeyCredential(self.key)
        text_analytics_client = TextAnalyticsClient(
                endpoint=self.endpoint, 
                credential=ta_credential)
        return text_analytics_client

    def analyze_sentiment(self, text):
        response = self.client.analyze_sentiment(documents=[text],language="ja")[0]
        return response.sentiment


