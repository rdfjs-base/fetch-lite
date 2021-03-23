const jsonldContextLinkUrl = require('./jsonldContextLinkUrl')

function attachQuadStream (res, fetch, parsers) {
  res.quadStream = async () => {
    if (!res.headers.get('content-type')) {
      return Promise.reject(new Error('Fetch response is missing HTTP Content-Type header - without' +
        ' this we can\'t determine which parser to use (consider setting this header yourself' +
        ' on the response object before attempting to process it).'))
    }

    // content type from headers without encoding, if given
    let contentType = res.headers.get('content-type').split(';')[0]

    // JSON-LD context URL from headers
    const contextLinkUrl = jsonldContextLinkUrl(res, contentType)

    // use JSON-LD content type if there is a context URL
    if (contextLinkUrl) {
      contentType = 'application/ld+json'
    }

    // is there a parser for the content?
    if (!parsers.has(contentType)) {
      return Promise.reject(new Error(`unknown content type: ${contentType}`))
    }

    let jsonldContext
    if (contextLinkUrl) {
      jsonldContext = await fetch(contextLinkUrl).then(res => res.json())
    }

    // parse the content using baseIRI and content
    return parsers.import(contentType, res.body, {
      baseIRI: res.url,
      context: jsonldContext
    })
  }
}

module.exports = attachQuadStream
