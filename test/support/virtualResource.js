const nock = require('nock')

function virtualResource ({
  method = 'GET',
  id,
  statusCode,
  content = '<http://example.org/subject> <http://example.org/predicate> "object" .',
  contentType = 'application/n-triples',
  headers = {}
} = {}) {
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

    if (content && contentType) {
      headers['content-type'] = contentType
    }

    if (content) {
      headers['content-length'] = content.length
    }

    return [statusCode || (content ? 200 : 201), content, headers]
  })

  return result
}

module.exports = virtualResource
