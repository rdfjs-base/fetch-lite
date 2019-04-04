const attachDataset = require('./attachDataset')
const attachQuadStream = require('./attachQuadStream')

function patchResponse (res, factory, fetch, parsers) {
  attachQuadStream(res, fetch, parsers)

  if (factory) {
    attachDataset(res, factory)
  }

  return res
}

module.exports = patchResponse
