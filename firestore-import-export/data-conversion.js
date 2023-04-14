const fs = require('fs');
const JSONStream = require('JSONStream');
const { Parser } = require('json2csv');
const jconv = require('jconv');

const inputStream = fs.createReadStream('./firestore-export.json');
const outputStream = fs.createWriteStream('export.csv');

const jsonStream = JSONStream.parse('*');
const fields = [
  { label: 'ID', value: 'id' },
  { label: '合計トークン', value: 'token' },
];
const json2csvParser = new Parser({ fields, header: true, withBOM: true });

inputStream.pipe(jsonStream);

const obj = [];
jsonStream.on('data', (item) => {
  for (const i in item) {
    obj.push({
      id: i,
      token: item[i]['token'],
    });
  }
});

jsonStream.on('end', () => {
  const parsedCsv = json2csvParser.parse(obj);
  const convertedCsv = jconv.convert(parsedCsv, 'UTF8', 'SJIS');
  outputStream.write(convertedCsv);
  console.log('Done!');
});