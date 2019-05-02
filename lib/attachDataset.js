const fromStream = require('./fromStream')

function attachDataset (res, factory) {
  res.dataset = async () => {
    if (!factory) {
      throw new Error('Missing dataset factory')
    }
    const stream = await res.quadStream()
    return fromStream(factory.dataset(), stream)
  }
}

module.exports = attachDataset
