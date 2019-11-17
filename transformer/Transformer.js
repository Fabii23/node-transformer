const Transform = require("stream").Transform;

/*
 *Transform streams are really nice for manipulating
 *data on fly without having to read everything into
 *memory.
 *
 * Extend stream Transform and pass functionality
 * onto class.
 */
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

module.exports = {
  Transformer
};
