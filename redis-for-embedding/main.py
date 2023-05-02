#%%
import os
import ast
from dotenv import load_dotenv
import numpy as np
import openai
import pandas as pd
import redis
import tiktoken
from openai.embeddings_utils import get_embedding, cosine_similarity
from redis.commands.search.query import Query, Filter
from redis.commands.search.result import Result
from redis.commands.search.field import VectorField, TextField

#%%
load_dotenv()

# Azure OpenAI Service のパラメーター
openai_name = os.environ.get("OPENAI_NAME")
openai_uri = f"https://{openai_name}.openai.azure.com/"

openai.api_type = "azure"
# openai.api_base = "https://<your-openai-name>.openai.azure.com/"
openai.api_base = openai_uri
openai.api_version = "2022-12-01"
# openai.api_key = "<your-openai-key>"
openai.api_key = os.environ.get("OPENAI_KEY")

#%%
# embeddings モデルのパラメーター
# embedding_model_for_doc = "デプロイしたモデルの名前" 
embedding_model_for_doc = "text-search-doc"
# embedding_model_for_query = "デプロイしたモデルの名前" 
embedding_model_for_query = "text-search-query"
# embedding_encoding = "cl100k_base"
embedding_encoding = "gpt2"
max_tokens = 2000  # 最大トークン数は 2046 のため少し余裕を持った最大値を設定する

#%%
# データのロードと確認
input_datapath = "data/data.csv"
df = pd.read_csv(input_datapath)

#タイトルと価格をあわせてCombined列を作る
df["Combined"] = (
    "title: " + df.title.str.strip() + "; Cost: " + df.cost.str.strip()
)

encoding = tiktoken.get_encoding(embedding_encoding)

#%%
# 埋め込み実行 data_embeddings.csvとして保存
df["Embedding"] = df["Combined"].apply(lambda x: get_embedding(x, engine=embedding_model_for_doc))
df.to_csv("data/data_embeddings.csv")

#%%
df["Embedding"][0]
#%%
#ベクトルの次元数を確認
len(df["Embedding"][0])
#%%
embedding_dimension = 1536  # 出力ベクトル空間の次元数は1536
#%%
##検索用関数
# クエリにマッチする商品を検索して返す (ローカル PC 上)
def search_reviews(df, description, n=3, pprint=True, engine="text-search-query"):
    #検索クエリをベクトル化
    embedding = get_embedding(description, engine=engine)

    #コサイン類似度判定した結果とCombind内容をSimilarity列、Ret_Combined列として追加する。
    df["Similarity"] = df["Embedding"].apply(lambda x: cosine_similarity(x, embedding))
    df["Ret_Combined"] = df["Combined"].str.replace("title: ", "").str.replace("; Cost:", ": ")
    print(df)

    #dfの中からSimilarity列の値に基づいて上位n行を抽出し、その抽出された行からSimilarityとRet_Combinedの2つの列だけを取り出す
    results = (
        df.sort_values("Similarity", ascending=False).head(n).loc[:,["Similarity", "Ret_Combined"]]
    )

    #各行の Similarity と Ret_Combined の値を、| で区切ってコンソールに出力。
    #Ret_Combinedの値は最初の200文字だけ出力。
    #pprintがTruenoときだけ実行
    if pprint:
        for i,r in results.iterrows():
            print("%s | %s\n" % (r["Similarity"], r["Ret_Combined"][:200]))

    return results

#%%
#検索クエリ
results = search_reviews(df, "さっぱりとしたお酒", n=3, engine=embedding_model_for_query)

#%%
#Redis接続
redis_conn = redis.StrictRedis(host="52.253.100.248",port=6379)

#%%
# インデックスを作成する。
schema = ([
    TextField("itemid"),
    VectorField("Embedding", "HNSW", {"TYPE": "FLOAT32", "DIM": embedding_dimension, "DISTANCE_METRIC": "COSINE" }),
    TextField("title"),
    TextField("cost"),
    TextField("Combined"),
])

# redis_conn.ft().dropindex(schema)
redis_conn.ft().create_index(schema)

#%%
# Vm上のRedisにdfのデータを展開する
def load_vectors(client,df):
    p = client.pipeline(transaction=False)

    for i in df.index:
        key = f"doc:{str(i)}"
        data = {
            "itemid": str(i),
            "Embedding": np.array(df["Embedding"][i]).astype(np.float32).tobytes(),
            "title": df["title"][i],
            "cost": df["cost"][i],
            "Combined": df["Combined"][i],
        }
        # データを追加する
        client.hset(key, mapping=data)

    p.execute()

load_vectors(redis_conn, df)
#%%
#データが追加されたか確認する
print("Index size: ", redis_conn.ft().info()['num_docs'])
#%%
# クエリにマッチするメニューを検索して返す (Redis 上)
def search_reviews_redis(query, n=3, pprint=True, engine=embedding_model_for_query):
    q_vec = np.array(get_embedding(query, engine=engine)).astype(np.float32).tobytes()
    
    q = Query(f"*=>[KNN {n} @Embedding $vec_param AS vector_score]").sort_by("vector_score").paging(0,n).return_fields("vector_score", "Combined").return_fields("vector_score").dialect(2)
    
    params_dict = {"vec_param": q_vec}
    ret_redis = redis_conn.ft().search(q, query_params = params_dict)
    
    columns = ["Similarity", "Ret_Combined"]
    ret_df = pd.DataFrame(columns=columns)

    for doc in ret_redis.docs:
        # コサイン距離をコサイン類似度に変換
        sim = 1 - float(doc.vector_score)

        com = doc.Combined[:200].replace("Title: ", "").replace("; Content:", ": ")

        append_df = pd.DataFrame(data=[[sim, com]], columns=columns)

        ret_df = pd.concat([ret_df, append_df], ignore_index=True, axis=0)

        if pprint:
            print("%s | %s\n" % (sim, com))
    return ret_df

results_redis = search_reviews_redis("くたびれたサラリーマンが好むお酒")

#%%
results_redis