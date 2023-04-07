## セカンドハンドさん firestore からのユーザーデータ抽出手順

0. git clone
1. [GoogleDreive](https://drive.google.com/file/d/1L1a62FpAk0aGv6ElkxUM3MfAcOUtQWt2/view?usp=sharing"接続キー")から firestore 接続キーの入手してディレクトリ内に配置
2. (省略可) Vscode DevContainer からコンテナ起動
3. (省略可) `npm install`
4. export-jp.sh を実行 `bash export-jp.sh`
5. export.csv が作成できば OK
6. csv ファイルは[GoogleDrive](https://drive.google.com/drive/folders/1nyVzpklcN1d7q9Zh2PPQzQVl-tx7i4te?usp=share_link)に格納

## セカンドハンドさん　firestore からCosmosへのデータ移行

0. cosmos-data-import/data-cosmos-conversion.js を実行してデータを整形 ```node data-cosmos-conversion.js```
1. import.jsonファイルが生成される
2. cosmos-import.jsの実行 ※接続先を加筆する事 ```node cosmos-import.js```

# Firestore Import Export

A script that help to export and import in Cloud Firestore
Download or clone this repository

```
git clone https://github.com/dalenguyen/firestore-import-export.git
```
