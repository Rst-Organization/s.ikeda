import boto3
import json
import os
from langchain.llms.openai import OpenAIChat
# from langchain.memory.chat_message_histories import DynamoDBChatMessageHistory
# from langchain.memory import ConversationBufferMemory
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain


embedding_bucket = os.environ["S3_BUCKET"]
openai_key = os.environ["OPENAI_KEY"]

s3 = boto3.client("s3")

def handler(event, context):
    event_body = json.loads(event["body"])
    human_input = event_body["prompt"]
    print(f"human_input: {human_input}")

    s3.download_file(embedding_bucket, "index.faiss", "/tmp/index.faiss")
    s3.download_file(embedding_bucket, "index.pkl", "/tmp/index.pkl")

    if (os.path.exists("/tmp/index.faiss") and os.path.exists("/tmp/index.pkl")):
        print("INFO: /tmp/input.faiss and pkl exists")

    else:
        print("ERROR: /tmp/input.faiss and pkl does not exist")
        return {"statusCode": 400, "body": json.dumps("Error: index.faiss and pkl does not exist")}

    embeddings = OpenAIEmbeddings(
        openai_api_key=openai_key,
    )

    llm = OpenAIChat(
        model_name="gpt-3.5-turbo",
        api_key=openai_key,
    )

    faiss_index = FAISS.load_local("/tmp", embeddings)

    # message_history = DynamoDBChatMessageHistory(
    #     table_name=memory_table_name, session_id=conversation_id
    # )

    # memory = ConversationBufferMemory(
    #     memory_key="chat_history",
    #     chat_memory=message_history,
    #     input_key="question",
    #     output_key="answer",
    #     return_messages=True,
    # )

    qa = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=faiss_index.as_retriever(),
        # memory=memory,
        return_source_documents=True,
    )
    chat_history = []

    res = qa({"question": human_input, "chat_history": chat_history})

    print(f"res: {res}")

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
        },
        "body": json.dumps(res["answer"]),
    }