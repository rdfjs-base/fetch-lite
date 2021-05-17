const attachDataset = require('./attachDataset')
const attachQuadStream = require('./attachQuadStream')

function patchResponse (res, factory, fetch, parsers) {
  const contentLength = parseInt(res.headers.get('content-length')) > 0
  const chunkedEncoding = res.headers.get('transfer-encoding') === 'chunked'
  const hasBody = contentLength > 0 || chunkedEncoding

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
