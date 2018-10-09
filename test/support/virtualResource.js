const nock = require('nock')

function virtualResource ({ method = 'GET', id, statusCode, content, contentType = 'application/n-triples', headers = {} } = {}) {
  const result = {
    content: null,
    touched: false
  }

  let request

  if (method === 'GET') {
    request = nock('http://example.org').get(new RegExp(`${id}.*`))
  } else if (method === 'POST') {
    request = nock('http://example.org').post(id)
  }

  request.reply(function (uri, body) {
    result.touched = true
    result.headers = this.req.headers
    result.content = body

    if (contentType) {
      headers['content-type'] = contentType
    }

    return [statusCode || (content ? 200 : 201), content, headers]
  })

  return result
}

module.exports = virtualResource
