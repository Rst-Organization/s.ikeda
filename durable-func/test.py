#%%
import openai
import os


openai.api_key= "<APIKEY>"

#%%
def create_image(NUMBER_OF_IMAGES: int, prompt: str,):
    try:
        response = openai.images.generate(
            model="dall-e-3",
            prompt=prompt,
            n=NUMBER_OF_IMAGES,
            size="1024x1024",
            quality="standard",
        )
        print("res!!!!:")
        print(response)
        image_url = response.data[0].url

        return image_url
    except Exception as e:
        print("Error: ", e)
        return None

#%%
def edit_image(NUMBER_OF_IMAGES: int, prompt: str,):
    try:
        response = openai.images.create_variation(
            image=open("test_img.png", "rb"),
            model="dall-e-2",
            n=NUMBER_OF_IMAGES,
            size="1024x1024",
        )
        print("res!!!!:")
        print(response)
        image_url = response.data[0].url

        return image_url
    except Exception as e:
        print("Error: ", e)
        return None

#%%
def modify_image(NUMBER_OF_IMAGES: int, prompt: str,):
    try:
        response = openai.images.edit(
            image=open("test_img.png", "rb"),
            mask=open("test_mask.png", "rb"),
            model="dall-e-2",
            n=NUMBER_OF_IMAGES,
            size="1024x1024",
            prompt=prompt,
        )
        print("res!!!!:")
        print(response)
        image_url = response.data[0].url

        return response
    except Exception as e:
        print("Error: ", e)
        return None

#%%
response = openai.images.generate(
            model="dall-e-3",
            prompt="""
            以下の指示に基づいた画像を生成してください。
            実写の人間の顔を生成してください。
            性別: 女性
            国籍: 日本人
            髪型: ロングヘア
            見た目: 険しい顔つき
            年齢: 50代
            職業: 工場作業員
            服装: 作業着""",
            n=1,
            size="1024x1024",
            quality="standard",
            response_format="url"
        )
print("res!!!!:")
print(response.data[0].url)

#%%
image = create_image(1, f"""以下の指示に基づいて画像を変更してください。
                     created=1701061604を変更して悲しい顔にする""")

#%%
print(image)

#%%
new_image = edit_image(1, "日本人に変更してください。")

#%%
modify_img = modify_image(1, "背後に可愛いキャラクターを加えてください。")

#%%
print(modify_img)

