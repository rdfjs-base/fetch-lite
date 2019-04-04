const fromStream = require('./fromStream')

function attachDataset (res, factory) {
  res.dataset = async () => {
    const stream = await res.quadStream()
    return fromStream(factory.dataset(), stream)
  }
}

module.exports = attachDataset
