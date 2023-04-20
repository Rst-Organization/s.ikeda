const fs = require("fs");
const JSONStream = require("JSONStream");
const data = require("../firestore-export.json");

const fileName = "import.json";
const writeStream = fs.createWriteStream(fileName);

const stringifyStream = JSONStream.stringifyObject();

stringifyStream.pipe(writeStream);

for (const key in data) {
  const item = data[key];

  for (const i in item) {
    const obj = {
      id: i,
      messages: item[i]["message"],
      token: item[i]["token"],
    };

    // objを文字列に変換してストリームに書き込む
    stringifyStream.write(JSON.stringify(obj));
  }
}

stringifyStream.end();

stringifyStream.on("end", () => {
  console.log("Done");
});

writeStream.on("error", (err) => {
  console.error("error", err);
});