const jsonldContextLinkUrl = require('./jsonldContextLinkUrl')

function attachQuadStream (res, options, fetch, parsers) {
  res.quadStream = () => {
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

    return Promise.resolve().then(() => {
      // if there is a context URL, fetch the context
      if (contextLinkUrl) {
        return fetch(contextLinkUrl).then(res => res.json())
      } else {
        return undefined
      }
    }).then(jsonldContext => {
      // parse the content using baseIRI and content
      return parsers.import(contentType, res.body, {
        baseIRI: res.url,
        context: jsonldContext
      })
    })
  }
}

module.exports = attachQuadStream
