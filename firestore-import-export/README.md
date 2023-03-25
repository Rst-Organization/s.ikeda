## ラージハウスさん firestore からのユーザーデータ抽出手順

0. git clone
1. [GoogleDreive](https://drive.google.com/file/d/1L1a62FpAk0aGv6ElkxUM3MfAcOUtQWt2/view?usp=sharing"接続キー")から firestore 接続キーの入手してディレクトリ内に配置
2. (省略可) Vscode DevContainer からコンテナ起動
3. (省略可) `npm install`
4. export-jp.sh を実行 `bash export-jp.sh`
5. export.csv が作成できば OK
6. csv ファイルは[GoogleDrive](https://drive.google.com/drive/folders/1nyVzpklcN1d7q9Zh2PPQzQVl-tx7i4te?usp=share_link)に格納

# Firestore Import Export

A script that help to export and import in Cloud Firestore
Download or clone this repository

```
git clone https://github.com/dalenguyen/firestore-import-export.git
```
