async function fromStream (dataset, stream) {
  for await (const quad of stream) {
    dataset.add(quad)
  }

  return dataset
}

export default fromStream
