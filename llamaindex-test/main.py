#%%
import os
import logging
import sys

from llama_index import SimpleDirectoryReader, ServiceContext, GPTSimpleVectorIndex, LLMPredictor
from langchain.chat_models import ChatOpenAI
from llama_index.prompts.prompts import RefinePrompt, QuestionAnswerPrompt

os.environ["OPENAI_API_KEY"] = ""

#%%
# ログレベルの設定
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG, force=True)

#%%
# データの読み込み
documents =  SimpleDirectoryReader("data").load_data()

#%%
# gpt-3.5-turbo を指定（現状デフォルトは davinci ）
service_context = ServiceContext.from_defaults(
    llm_predictor = LLMPredictor(llm= ChatOpenAI(temperature=0,model_name="gpt-3.5-turbo",max_tokens=500))
    )

#%%
# documents をもとに Embbeddings API を通信してベクター取得し GPTSimpleVectorIndex を生成
index = GPTSimpleVectorIndex.from_documents(documents, service_context=service_context)

#%%
# ベクターを保存
index.save_to_disk("index/index.json")

#%%
# 質問文
qry ="あっさりとしたメニューをおしえてください"

#%%クエリ用のQAプロンプトを生成
QA_PROMPT_TMPL = (
    "私たちは以下の情報をコンテキスト情報として与えます。 \n"
    "---------------------\n"
    "{context_str}"
    "\n---------------------\n"
    "あなたはAIとして、この情報をもとに質問を日本語で答えます。前回と同じ回答の場合は同じ回答を行います。: {query_str}\n"
)
qa_prompt = QuestionAnswerPrompt(QA_PROMPT_TMPL)

#%%回答要求用のプロンプトを生成

REFINE_PROMPT = ("元の質問は次のとおりです: {query_str} \n"
    "既存の回答を提供しました: {existing_answer} \n"
    "既存の答えを洗練する機会があります \n"
    "(必要な場合のみ)以下にコンテキストを追加します。 \n"
    "------------\n"
    "{context_msg}\n"
    "------------\n"
    "新しいコンテキストを考慮して、元の答えをより良く洗練して質問に答えてください。\n"
    "コンテキストが役に立たない場合は、元の回答と同じものを返します。")

refine_prompt = RefinePrompt(REFINE_PROMPT)
#%%
# ベクトルファイルを読み込む
bectorFile = GPTSimpleVectorIndex.load_from_disk("index/index.json", service_context=service_context)

#%%
# ベクター検索 + Chat Completion API 実行 検索結果TOP3を返す
response = bectorFile.query(qry,
                       text_qa_template=qa_prompt,
                       refine_template=refine_prompt,
                       similarity_top_k=3)

#%%
print(response)

#%%
print(response.get_formatted_sources())
