const rdf = require('rdf-ext')

function attachQuadStream (context, res) {
  res.quadStream = () => {
    let contentType = context.options.defaultContentType ||
      context.defaults.defaultContentType ||
      context.formats.parsers.list().shift()

    if (res.headers.has('content-type')) {
      contentType = res.headers.get('content-type').split(';').shift()
    }

    return res.readable().then(function (readable) {
      return context.formats.parsers.import(contentType, readable, {
        baseIRI: context.url
      })
    })
  }
}

function attachDataset (context, res) {
  res.dataset = () => {
    return res.quadStream().then((stream) => {
      return rdf.dataset().import(stream)
    })
  }
}

function patchResponse (context, res) {
  if (res.status === 204) {
    return res
  }

  attachQuadStream(context, res)
  attachDataset(context, res)

  return res
}

patchResponse.attachQuadStream = attachQuadStream
patchResponse.attachDataset = attachDataset

module.exports = patchResponse
