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
from redis.commands.search.query import Query
from redis.commands.search.result import Result
from redis.commands.search.field import VectorField, TextField, NumericField

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
embedding_encoding = "gpt2" # 今回使用するモデルは GPT-2/GPT-3 トークナイザーを使用する
max_tokens = 2000  # 最大トークン数は 2046 のため少し余裕を持った最大値を設定する
embedding_dimension = 1024  # 出力ベクトル空間の次元数は 1024

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
df
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
#保存してあるcsvを読み込む
df_csv = pd.read_csv("data/data_embeddings.csv")
#%%
#csvから通常に読み取った状態だとベクトル配列は文字列として認識している為、文字列からまずはリストに変換するための関数を定義。
def str_to_list(s):
    try:
        return ast.literal_eval(s)
    except(ValueError,SyntaxError):
        return None
#%%
#データフレームのEmbedding列に適用しリストに変換。
df_csv['Embedding'] = df_csv['Embedding'].apply(str_to_list)

#%%
#リストをnumpy配列に変換。
df_csv['Embedding'] = df_csv['Embedding'].apply(lambda x: np.array(x) if x is not None else None)
#%%
#numpy配列かどうかをチェックする関数
def is_numpy_array(value):
    return isinstance(value, np.ndarray)

#numpy配列か否かをチェックした結果をis_numpy列として追加する
df_csv["is_numpy"] = df_csv["Embedding"].apply(is_numpy_array)

#チェックする（True or False)
all_numpy_arrays = df_csv["is_numpy"].all()
print(all_numpy_arrays)

#%%
#検索クエリを実行
results = search_reviews(df_csv, "さっぱりとしたお酒", n=3, engine=embedding_model_for_query)
print(results)

#%%
