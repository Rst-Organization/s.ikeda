const Fs  = require('fs');
const data = require('../firestore-export.json');
const obj = []

for(const key in data){
    const item = data[key]

    for(const i in item){
        obj.push({
            id: i,
            messages:item[i]["message"],
            token:item[i]["token"]
        })
    }
}


const fileName = "import.json";
const datas = JSON.stringify(obj, null, 2)

Fs.writeFile(fileName,datas,(err)=>{
    if(err){
        console.error("error",err);
    }else{
        console.log("Done")
    }
})