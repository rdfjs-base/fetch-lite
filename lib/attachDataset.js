function attachDataset (res, factory) {
  res.dataset = () => {
    return res.quadStream().then((stream) => {
      return factory.dataset().import(stream)
    })
  }
}

module.exports = attachDataset
