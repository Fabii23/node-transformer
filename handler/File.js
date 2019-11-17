const EventEmitter = require("events");
let { Transformer } = require("./../transformer/Transformer");

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

/*

const Readable = require("stream").Readable;
static getUsage() {
  console.log("Add some text about how to use this class.");
}

 /**
 * Transform and return a this reference for chaining.
 */

/*
transformArray(array, mapping) {
  this.emit("log", "[transformArray]");
  this.content = array.map(mapping);
  return this;
}

getReadable() {
  return new Readable({
    objectMode: true,
    read() {}
  });
}*/

/**
 * Meant for smaller files.
 * @param {} path
 */

/*
writeTo(path) {
  this.emit("log", "[writeTo]");

  let readable = this.getReadable();
  let writable = this.getWriteStream(path);

  readable.push(JSON.stringify(this.content));
  readable.pipe(writable);

  writable.on("error", function(err) {
    throw new Error(err);
  });
}
*/
