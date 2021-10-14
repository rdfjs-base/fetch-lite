import attachDataset from './attachDataset.js'
import attachQuadStream from './attachQuadStream.js'

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

export default patchResponse
