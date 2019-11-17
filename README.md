# node-transformer

## On the fly data manipulation with Node.js

On the fly data manipulation can be achieved with Node.js **stream.Transform** class. This class allows manipulation of
data without having to read it all into memory.

Transform streams are streams which read, process, manipulate, then output the data in its new form.
Transform streams are known as Duplex streams, Duplex streams implement both the Readable and Writeable interface.

This Duplex property allows you to chain streams together to create complex processes by piping from one to the next.
This example creates a simple transformer that will transform the content of a sample JSON file and output it to another file.

### Install instructions

1. Open your favorite console and run the commands below
2. npm install
3. npm run dev

## Application overview

1. Create a Transformer class .
2. Create a class to encapsulate and handle file operations.
3. Create a utility class to start the transformation process.
4. Create an entry point for our node application.

## 1.) Create a Transformer class

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

This class above is pretty simple, it has an optional parameter, a mapping function that will be handling the
transformation of each data chunk.

See below for an example of the mapping function expression we will be using. It extracts an **id** and **title**
from a supplied json item. This function expression uses destructuring to extract the 'id' and 'title' properties.

```javascript
const mapping = function(x) {
  let { id, title } = x;
  return { id, title };
};
```

Sample JSON

```json
[
  {
    "userId": 1,
    "id": 1,
    "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
    "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
  },
  {
    "userId": 1,
    "id": 2,
    "title": "qui est esse",
    "body": "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla"
  }
]
```

## 2.) Create a class to encapsulate and handle file operations

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

## 3.) Create a utility class to start the transformation process

```javascript
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
```

## 4.) Create an entry point for our node application

```javascript
const app = require("express")();
const PORT = process.env.PORT || 3000;

async function startServer() {
  //Use a loader to decrease the file size of you app entry
  await require("./loaders")();

  // Turn on that server!
  app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
  });
}
startServer();
```
