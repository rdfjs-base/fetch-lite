const attachDataset = require('./attachDataset')
const attachQuadStream = require('./attachQuadStream')

function patchResponse (res, factory, fetch, parsers) {
  const contentHeader = [...res.headers.keys()].some(header => header.startsWith('content-'))
  const chunkedEncoding = res.headers.get('transfer-encoding') === 'chunked'
  const hasBody = contentHeader || chunkedEncoding

  // only attach .quadStream() and .dataset() if there is a body
  if (hasBody) {
    attachQuadStream(res, fetch, parsers)

    if (factory) {
      attachDataset(res, factory)
    }
  }

  return res
}

module.exports = patchResponse
