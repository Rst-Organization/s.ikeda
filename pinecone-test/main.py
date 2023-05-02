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
#pineconeのインデックス作成
pinecone.init(api_key=pineconeKey, environment="us-west1-gcp-free")

pinecone.create_index("example-index", dimension=embedding_dimension, metric="cosine")

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
                {"ans": df["ans"][i], "um1": df["um1"][i]}
            )
        ],
    )

#%%
# クエリ検索用のベクトル
embedding = get_embedding("子供の養育費", engine=MODEL)

#%%
res = pinecone_index.query(
        [embedding], 
        top_k=3, 
        # filter={
        #     "um1": {"$in": ["妊娠・出産"]}
        # },
        include_metadata=True
    )

#%%
for i in res["matches"]:
    print(i["score"])
    print(i["id"])
    print(i["metadata"]["ans"])
    print(i["metadata"]["um1"])
    print("------")
