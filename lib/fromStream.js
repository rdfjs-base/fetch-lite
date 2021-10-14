import waitFor from './waitFor.js'

async function fromStream (dataset, stream) {
  stream.on('data', quad => dataset.add(quad))

  await waitFor(stream)

  return dataset
}

export default fromStream
