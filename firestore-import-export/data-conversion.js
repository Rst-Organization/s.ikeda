const Fs  = require('fs');
const { Parser } = require('json2csv');
const data = require('./firestore-export.json');
const jconv = require('jconv');
const obj = []

//id,tokenで整理したオブジェクトを配列に格納
for(const key in data){
  const item = data[key]

  for(const i in item){
    //console.log(i,item[i]['token'])
    obj.push({
      id:i,
      token:item[i]['token']
    })
  }
}

//CSV出力の際のヘッダーと値をセットしてCSVに変換
const fields = [ 
  { label: 'ID', value: 'id'},
  { label: '合計トークン', value: 'token'},
]
const json2csvParser = new Parser({fields, header:true, withBOM: true});
const parsedCsv = json2csvParser.parse(obj);

//Shift-JISへ変換してCSVファイルとして出力
jconv.convert(parsedCsv, 'UTF8', 'SJIS');
Fs.writeFileSync("export.csv", parsedCsv);
console.log('Done!')
