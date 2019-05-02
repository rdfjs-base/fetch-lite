const nock = require('nock')

const whitelistedVerbs = ['GET', 'POST']

function virtualResource ({ method = 'GET', id, statusCode, content, contentType = 'application/n-triples', headers = {} } = {}) {
  const result = {
    content: null,
    touched: false
  }

  let request

  if (whitelistedVerbs.includes(method)) {
    const nockMethod = method.toLowerCase()
    request = nock('http://example.org')[nockMethod](new RegExp(`${id}.*`))
  }

  request.reply(function (uri, body) {
    result.touched = true
    result.headers = this.req.headers
    result.content = body

    if (contentType) {
      headers['content-type'] = contentType
    }

    // HTTP errors are usually text/html
    if (statusCode && statusCode > 399) {
      headers['content-type'] = 'text/html'
      result.content = `Error: HTTP${statusCode}`
    }

    return [statusCode || (content ? 200 : 201), content, headers]
  })

  return result
}

module.exports = virtualResource
