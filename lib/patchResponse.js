const attachDataset = require('./attachDataset')
const attachQuadStream = require('./attachQuadStream')

function patchResponse (res, options, factory, fetch, parsers) {
  attachQuadStream(res, options, fetch, parsers)

  if (factory) {
    attachDataset(res, factory)
  }

  return res
}

module.exports = patchResponse
