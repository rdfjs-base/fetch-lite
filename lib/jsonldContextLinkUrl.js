const url = require('url')

const linkRegExp = new RegExp('<(.*)>')

function jsonldContextLinkUrl (res, contentType) {
  // only search for a context link when the content type is application/json
  if (contentType !== 'application/json') {
    return null
  }

  // no header link at all
  if (!res.headers.has('link')) {
    return null
  }

  // get all links and trim them
  const links = res.headers.get('link').split(',').map(link => link.trim())

  // filter the context link
  const contextLink = links.filter((link) => link.includes('rel="http://www.w3.org/ns/json-ld#context"'))[0]

  // no context link found
  if (!contextLink) {
    return null
  }

  // extract the URL
  const contextUrl = (linkRegExp.exec(contextLink) || []).slice(-1)[0]

  // invalid link format
  if (!contextUrl) {
    return null
  }

  // resolve the URL
  return url.resolve(res.url, contextUrl) // eslint-disable-line node/no-deprecated-api
}

module.exports = jsonldContextLinkUrl
