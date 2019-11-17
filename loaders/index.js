const fs = require("fs");
const File = require("./../handler/File");
const path = require("path");

module.exports = async function() {
  const outputDataPath = path.resolve(__dirname, "outputData.json");
  const dataPath = path.resolve(__dirname, "./../data/data.json");

  startReadableStreamFileReader(dataPath, outputDataPath);
};

async function startReadableStreamFileReader(dataPath, outputDataPath) {
  try {
    let file = new File(dataPath, fs);
    let fileExists = await file.fileExists();
    const mapping = function(x) {
      let { id, title } = x;
      return { id, title };
    };

    if (fileExists) {
      await file.streamWriteTo(outputDataPath, mapping);
      console.log("Data piping and transformation completed ..");
    } else {
      throw new Error("File does not exist");
    }
  } catch (err) {
    //This should not happen, so halt the program if an error occurs
    throw new Error(err);
  }
}
