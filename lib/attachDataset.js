import fromStream from './fromStream.js'

function attachDataset (res, factory) {
  res.dataset = async () => {
    const stream = await res.quadStream()
    return fromStream(factory.dataset(), stream)
  }
}

export default attachDataset
