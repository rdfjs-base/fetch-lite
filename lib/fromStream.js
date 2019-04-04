const waitFor = require('./waitFor')

async function fromStream (dataset, stream) {
  stream.on('data', quad => dataset.add(quad))

  await waitFor(stream)

  return dataset
}

module.exports = fromStream
