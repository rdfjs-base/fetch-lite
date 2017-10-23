const rdf = require('rdf-ext')
const url = require('url')

const linkRegExp = new RegExp('<(.*)>')

function attachQuadStream (context, res) {
  res.quadStream = () => {
    let contentType = context.options.defaultContentType ||
      context.defaults.defaultContentType ||
      context.formats.parsers.list().shift()

    if (res.headers.has('content-type')) {
      contentType = res.headers.get('content-type').split(';').shift()
    }

    // check if there is a JSON-LD context link header
    let contextLinkUrl

    if (contentType === 'application/json') {
      contextLinkUrl = (res.headers.get('link') || '').split(',').map(link => link.trim()).filter((link) => {
        return link.indexOf('rel="http://www.w3.org/ns/json-ld#context"') !== -1
      }).map((link) => {
        return url.resolve(res.url, linkRegExp.exec(link).pop())
      }).shift()
    }

    return Promise.resolve().then(() => {
      if (contextLinkUrl) {
        return context.fetch(contextLinkUrl).then(res => res.json())
      } else {
        return undefined
      }
    }).then((jsonldContext) => {
      return context.formats.parsers.import(contentType, res.body, {
        baseIRI: context.url,
        context: jsonldContext
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
