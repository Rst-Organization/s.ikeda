#%%
import os
from dotenv import load_dotenv
import numpy as np
import openai
from openai.embeddings_utils import get_embedding
import pandas as pd
import pinecone

load_dotenv()

openai.api_key = os.environ.get("OPENAIKEY")
pineconeKey = os.environ.get("PINECONEKEY")
MODEL = "text-embedding-ada-002"
embedding_dimension = 1536  # ada-002を使ったときのベクトル空間の次元数は1536
#%%
#データ読み込みと欠損の確認
df = pd.read_csv("data/data.csv")
df.isna().sum()

# %%
#質問と答えを合わせたCombined列を作成
df["Combined"] = (
    "qes: " + df.qes.str.strip() + "; ans: " + df.ans.str.strip()
)
df["Combined"].isna().sum()

#%%
# 埋め込み実行 data_embeddings.csvとして保存しておく
df["Embedding"] = df["Combined"].apply(lambda x: get_embedding(x, engine=MODEL))
df.to_csv("data/data_embeddings.csv")

#%%
#確認
df["Embedding"][0]
# %%
len(df["Embedding"][0])
# %%
#pineconeのインデックスを作成する
pinecone.init(api_key=pineconeKey, environment="us-west1-gcp-free")

#%%
pinecone.create_index("example-index", dimension=embedding_dimension, metric="cosine")

#%%
pinecone_index = pinecone.Index("example-index")

#%%
df
#%%
#indexにデータを流す
for i in df.index:
    pinecone_index.upsert(
        vectors=[
            (
                str(df["id"][i]),
                df["Embedding"][i],
                {"text": df["ans"][i], "source": df["Combined"][i]}
            )
        ],
    )

#%%
q = "子供が生まれたらまずは何をすればいいですか？"
# クエリ検索用のベクトルを生成
embedding = get_embedding(q, engine=MODEL)

#%%
# pineconeに作成したindexに対してクエリを発行 結果TOP3を表示
res = pinecone_index.query(
        [embedding], 
        top_k=3, 
        # filter={
        #     "source": {"$in": ["妊娠・出産"]} #特定ワードをフィルターで入れる事もできる
        # },
        include_metadata=True
    )

#%%
#確認
ansList = []

for i in res["matches"]:
    score = i["score"]
    id = i["id"]
    text = i["metadata"]["text"]
    source = i["metadata"]["source"]

    ansList.append(text)
    print(f"id: {id}")
    print(f"score: {score}")
    print(f"text: {text}")
    print(f"source: {source}")
    print("------")

#%%
print(ansList)

#%%
# 検索結果をgptに返答させる。※ davinciの場合
response = openai.Completion.create(
    engine="text-davinci-003",
    prompt=f"Please answer the question in Japanese, taking into account the following context. \
        Context: \
            Question: {q} \
            Answer: {ansList[0]},{ansList[1]},{ansList[2]}",
    temperature=0,
    max_tokens=500
)
print(response.choices[0]["text"])

#%%
#検索結果をgptに返答させる。gpt-3.5-turboの場合

prompt_prefix = \
f"市You are an AI assistant supporting questions about City Hall. Please answer questions in Japanese. \
If you do not have sufficient information, answer don't know."

response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": prompt_prefix },
        {"role": "assistant", "content": f"{ansList[0]},{ansList[1]}" },
        {"role": "user", "content": "Please extract only the important parts of this answer and explain in Japanese."},
    ],
)
print(response.choices[0]["message"]["content"].strip())

#%%
#LangChainでクエリ ＆ GPTで返答
# 必要なモジュールを追加
from langchain import VectorDBQA, OpenAI, VectorDBQAWithSourcesChain
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Pinecone

#%%
# LangChain用にembeddingsを再度初期化
OPENAI_API_KEY = os.environ.get("OPENAIKEY")
embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
#%%
#pineconeの初期設定を再度
pinecone.init(api_key=pineconeKey, environment="us-west1-gcp-free")

#%%
#すでにあるindexを指定してベクトルストアを指定してベクトル検索の基盤を設定
docsearch = Pinecone.from_existing_index("example-index", embeddings)

#%%
# まずは通常にクエリ 類似度TOP3
query = "子供が生まれたら何をすればいいですか？"
docs = docsearch.similarity_search(query,k=3)
# %%
# 上記(いつもどおりの結果)
print(docs)

#%%
# 検索結果をgptに返答させる。langchainを使ったパターン
# OpenAIのモデルのセットアップ
llm = OpenAI(
    openai_api_key=OPENAI_API_KEY,
    model_name='gpt-3.5-turbo',
    temperature=0.0
)

#%%
# VectorDBQAChainのセットアップ
chain = VectorDBQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    vectorstore=docsearch,
)
#%%
# クエリ＆返答
chain.run("子供が生まれたら何をすればいいですか？")

#%%
# 返答のソースを確認
sources = VectorDBQAWithSourcesChain.from_chain_type(
    llm=llm,
    chain_type="stuff",
    vectorstore=docsearch
)

sources("子供が生まれたら何をすればいいですか？")