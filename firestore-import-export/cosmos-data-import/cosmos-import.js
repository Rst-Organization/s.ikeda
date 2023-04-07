const { CosmosClient } = require("@azure/cosmos");
const fs = require("fs");

const endpoint = "https://****.documents.azure.com:443/のURLをいれてください";
const key = "プライマリーキーを入れてください";
const databaseId = "データベース名";
const containerId = "コンテナ名";

const client = new CosmosClient({ 
    endpoint,
    key,
    connectionPolicy:{
        requestTimeout: 300000,
    }});
const container = client.database(databaseId).container(containerId);

(async function importData() {
  // Read JSON data from file
  const rawData = fs.readFileSync("import.json");
  const items = JSON.parse(rawData);

  // Iterate through the items and insert them into the Cosmos DB container
  for (const item of items) {
    try{
        await container.item(item.id).replace(item);
    }catch(e){
        if(e.code === 404){
            await container.items.create(item);
        }else{
            console.log(`Error processing item with ID ${item.id}: ${e.message}`)
        }
    }
    }
    console.log("Data imported successfully!");
})();
