const fs = require('node:fs');
const path = require('node:path');

const textFileName = 'text.txt';
const pathToTextFile = path.join(__dirname, textFileName);
const readStreamTxtFile = fs.createReadStream(pathToTextFile, {
  encoding: 'utf8',
});

readStreamTxtFile.on('data', (dataChunk) => {
  console.log(dataChunk);
});
