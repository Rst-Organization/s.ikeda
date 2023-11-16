import json
import boto3
import os
from langchain.document_loaders import PyPDFLoader
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.indexes import VectorstoreIndexCreator
from langchain.vectorstores import FAISS


s3 = boto3.client("s3")
embedding_bucket = os.environ["S3_BUCKET"]
openai_key = os.environ["OPENAI_KEY"]

def handler(event, context):
    s3_info = event["Records"][0]["s3"]
    print(f"INFO: s3_info: {s3_info}")
    
    bucket_name = s3_info["bucket"]["name"]
    print(f"INFO: bucket_name: {bucket_name}")
    
    object_key = s3_info["object"]["key"]
    print(f"INFO: object_key: {object_key}")
    
    s3.download_file(bucket_name, object_key, "/tmp/input.pdf")

    if os.path.exists("/tmp/input.pdf"):
        print("INFO: /tmp/input.pdf exists")
        size = os.path.getsize("/tmp/input.pdf")
        print(f"File size: {size} bytes")
        _, ext = os.path.splitext("/tmp/input.pdf")
        if ext.lower() != ".pdf":
            print("ERROR: File extension is not pdf")
            return {"statusCode": 400, "body": json.dumps("Error: Not PDF")}
    else:
        print("ERROR: /tmp/input.pdf does not exist")
        return {"statusCode": 400, "body": json.dumps("Error: input.pdf does not exist")}
    
    loader = PyPDFLoader("/tmp/input.pdf")

    embeddings = OpenAIEmbeddings(
        openai_api_key=openai_key,
    )

    index_creator = VectorstoreIndexCreator(
        vectorstore_cls=FAISS,
        embedding=embeddings,
    )

    pages = loader.load_and_split()
    print("INFO: pages")
    print(pages[0])

    index_from_loader = index_creator.from_loaders([loader])

    index_from_loader.vectorstore.save_local("/tmp")
    s3.upload_file("/tmp/index.faiss", embedding_bucket, "index.faiss")
    s3.upload_file("/tmp/index.pkl", embedding_bucket, "index.pkl")

    print("INFO: Success")
    return {"statusCode": 200, "body": json.dumps("Success")}