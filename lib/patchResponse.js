const attachDataset = require('./attachDataset')
const attachQuadStream = require('./attachQuadStream')

function patchResponse (res, factory, fetch, parsers, options) {
  attachQuadStream(res, fetch, parsers, options)

  if (factory) {
    attachDataset(res, factory)
  }

  return res
}

module.exports = patchResponse
