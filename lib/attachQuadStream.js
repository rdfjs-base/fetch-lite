const jsonldContextLinkUrl = require('./jsonldContextLinkUrl')

function attachQuadStream (res, fetch, parsers, options) {
  res.quadStream = async () => {
    let contentType
    if (res.headers.get('content-type')) {
      // Content type from headers without encoding, if given.
      contentType = res.headers.get('content-type').split(';')[0]
    } else {
      if (options.headers['content-type']) {
        contentType = options.headers['content-type']
      } else {
        throw new Error('Fetch response provided no Content-Type header, and no content type option was provided.')
      }
    }

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
