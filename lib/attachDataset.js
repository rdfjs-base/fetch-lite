const fromStream = require('./fromStream')

function attachDataset (res, factory) {
  res.dataset = () => {
    return res.quadStream().then((stream) => {
      return fromStream(factory.dataset(), stream)
    })
  }
}

module.exports = attachDataset
