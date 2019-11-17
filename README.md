# node-transformer

## Real time data transformation with NodeJs

On the fly data manipulation can be achieved with NodeJs stream.Transform class. This class allows manipulation of
data without having to read it all into memory.

Transform streams are stream which read data, process the data, manipulate it, then output the data in its new form.
Transform stream are known as Duplex streams, which are simply streams that implement both the Readable and Writeable interface.

This Duplex property allows you to chain streams together to create complex processes by piping from one to the next.

In this post we will create a simple OO module that will transform the content of a json file and output it to another file.

Here is a birds eye overview of our module creation.

1.) Create a module which extends stream.Transform.
2.) Create a module that will encapsulate and handle file operations.
3.) Create a module to execute the code.

## 1.) Transform module

```javascript
const Transform = require("stream").Transform;

class Transformer extends Transform {
  constructor(mapping) {
    super();
    if (mapping) this.mapping = mapping;
  }

  _transform(chunk, enc, callback) {
    try {
      let str = this.get_mapped_chunk(chunk, this.mapping);
      this.push(JSON.stringify(str));
      callback();
    } catch (err) {
      throw new Error(err);
    }
  }

  get_mapped_chunk(chunk, mapping) {
    let parsedChunk = JSON.parse(chunk);
    return mapping ? parsedChunk.map(mapping) : parsedChunk;
  }
}

//Export our class
module.exports = {
  Transformer
};
```

/\*
This class is pretty simple, it has an optional parameter, a mapping function that will be handling the
transformation of each data chunk.

See below for an example of the mapping function expression we will be using. It extracts an 'id' and 'title'
from a supplied json item. This will make a bit more sense when you see the JSON data provided. Note
this function expression uses destructuring to extract the 'id' and 'title' properties.
\*/

```javascript
const mapping = function(x) {
  let { id, title } = x;
  return { id, title };
};
```

## 2.) File handler

```javascript
const Readable = require("stream").Readable;
const EventEmitter = require("events");
let { Transformer } = require("./Transformers");

class File extends EventEmitter {
  constructor(path, fs) {
    super();
    this.path = path;
    this.fs = fs;
    this.content = null;

    this.on("log", function() {
      console.log.apply(null, arguments);
    });
  }

  /**
   * Check if the file exists with the path provided in the constructor.
   * Could do this check in the constructor as well.
   */
  fileExists() {
    this.emit("log", "[fileExists]");
    return new Promise((resolve, reject) => {
      this.fs.exists(this.path, value => {
        resolve(value);
      });
    });
  }

  readFile() {
    this.emit("log", "[readFile]");
    return new Promise((resolve, reject) => {
      this.fs.readFile(this.path, "utf8", function(err, contents) {
        resolve(JSON.parse(contents));
      });
    });
  }

  getReadStream(encoding = { encoding: "UTF8" }) {
    return this.fs.createReadStream(this.path, encoding);
  }

  getWriteStream(outPath) {
    return this.fs.createWriteStream(outPath);
  }

  /**
   * Write using stream, meant for larger files.
   * @param {} path
   */
  streamWriteTo(outPath, mapping) {
    this.emit("log", "[streamWriteTo] " + outPath);

    let tx = new Transformer(mapping);
    let readable = this.getReadStream();
    let writable = this.getWriteStream(outPath);

    return new Promise((resolve, reject) => {
      readable.pipe(tx).pipe(writable, { end: false });

      readable
        .on("end", () => {
          this.emit("log", "readable end event triggered ...");
        })
        .on("error", function(err) {
          reject(err);
        })
        .on("close", () => {
          this.emit("log", "readable close event triggered ...");
          resolve();
        })
        .on("finish", () => {
          this.emit("log", "readble finish event triggered ...");
        });
    });
  }
}

module.exports = File;
```

## 3.) Execute our transformer

```javascript
const fs = require("fs");
const File = require("../../models/File/File");
const path = require("path");
const outputDataPath = path.resolve(__dirname, "outputData.json");
const dataPath = path.resolve(__dirname, "data.json");

const mapping = function(x) {
  let { id, title } = x;
  return { id, title };
};

module.exports = async function(app) {
  startReadableStreamFileReader();
};

async function startReadableStreamFileReader() {
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
    //This should not happen, so halt the program
    throw new Error(err);
  }
}
```
