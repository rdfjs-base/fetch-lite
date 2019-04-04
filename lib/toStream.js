const { Readable } = require('readable-stream')

function toStream (quads) {
  const stream = new Readable({ objectMode: true, read: () => {} })

  for (const quad of quads) {
    stream.push(quad)
  }

  stream.push(null)

  return stream
}

module.exports = toStream
