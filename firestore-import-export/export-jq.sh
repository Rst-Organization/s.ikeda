node export.js datas
node data-conversion.js
#cat firestore-export.json | jq -r '. .datas | .[] | [.token] |@csv'>export.csv