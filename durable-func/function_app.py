import azure.functions as func
import azure.durable_functions as df

import openai
import os
import base64
import json
from linebot import LineBotApi
from linebot.models import TextSendMessage, ImageSendMessage, AudioSendMessage

from io import StringIO
import uuid
from pathlib import Path
import logging
import tempfile
from typing import Dict
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential
from azure.storage.blob import BlobServiceClient

myApp = df.DFApp(http_auth_level=func.AuthLevel.ANONYMOUS)

openai.api_key=os.environ.get("OPENAI_KEY")
line_token=os.environ.get("LINE_TOKEN")

line_bot_api = LineBotApi(line_token)

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
    try:
        body = req.get_json()
        for event in body['events']:
            if event['type'] == 'message':
                if event['message']['type'] == 'text':

                    message = event['message']['text']
                    user_id = event['source']['userId']

                    instance_id = await client.start_new("hello_orchestrator", None, {"message": message, "user_id": user_id})

                    response = client.create_check_status_response(req, instance_id)
                    return response
    except Exception as e:
        func.HttpResponse("Error", status_code=400)
    
    return func.HttpResponse("OK", status_code=200)


# Orchestrator
@myApp.orchestration_trigger(context_name="context")
def hello_orchestrator(context):
    try:
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
        
        info = { "message": message, "user_id": user_id }

        image_url = yield context.call_activity("create_image", info)

        audit_url = yield context.call_activity("create_audio", message)
        line_bot_api.push_message(
            user_id,
            AudioSendMessage(original_content_url=audit_url, duration=2000)
        )

        return "Done"
    except Exception as e:
        send_push_message(user_id, "エラーが発生しました。")
        raise e


def send_push_message(id: str, texts: str):
    try:
        line_bot_api.push_message(
            id,
            TextSendMessage(text=texts)
        )
        return
    except Exception as e:
        logging.error(e)
        raise e

# Activity - Text Analyzer
@myApp.activity_trigger(input_name="message")
def text_analyzer(message: str) -> bool:
    try:
        sentiment = TextSentimentAnalyzer().analyze_sentiment(message)
        print("sentiment!!!:")
        print(sentiment)
        if sentiment == "positive":
            return False
        else:
            return True
    except Exception as e:
        logging.error(e)
        raise e


# Activity - Create Image
@myApp.activity_trigger(input_name="info")
def create_image(info: dict):
    try:
        message = info["message"]
        user_id = info["user_id"]
        NUMBER_OF_IMAGES = 1
        send_push_message(user_id, f"{message} なアイドルを生成します。")

        response = openai.images.generate(
            model="dall-e-3",
            prompt=message + "の言葉から連想する可愛い日本のアイドル画像を生成してください。",
            n=NUMBER_OF_IMAGES,
            size="1024x1024",
            quality="standard"
        )
        print("res!!!!:")
        print(response)
        image_url = response.data[0].url

        line_bot_api.push_message(
            user_id,
            ImageSendMessage(original_content_url=image_url, preview_image_url=image_url)
        )
        return image_url
    
    except Exception as e:
        logging.error(e)
        raise e

# Activity - 音声を生成
@myApp.activity_trigger(input_name="message")
def create_audio(message: str) -> str:
    try:
        unique_id = uuid.uuid4()
        # speech_file_path = Path(__file__).parent / "message.aac"
        speech_file_path = Path(tempfile.gettempdir()) / "message.aac"
        response = openai.audio.speech.create(
            model="tts-1",
            voice="nova",
            input=message,
            response_format="aac"
        )
        print("audio res!!!:")
        print(response)
        response.stream_to_file(speech_file_path)
        audit_url = AudioUploader().upload_audio(speech_file_path, f"{unique_id}_audio.aac")

        return audit_url

    except Exception as e:
        logging.error(e)
        raise e

# Class TextAnalyzer
class TextSentimentAnalyzer:
    def __init__(self):
        self.endpoint = os.environ.get("COGNATIVE_URL")
        self.key = os.environ.get("COGNATIVE_KEY")
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
    
class AudioUploader:
    def __init__(self):
        self.connection_key = os.environ.get("BLOB_KEY")
        self.container_name = "audio"
        self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_key)

    def upload_audio(self, audio_data_path, blob_name):
        blob_client = self.blob_service_client.get_blob_client(container=self.container_name, blob=blob_name)
        with open(audio_data_path, "rb") as data:
            blob_client.upload_blob(data, overwrite=True)
            return blob_client.url


