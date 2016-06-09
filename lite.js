var isomorphicFetch = require('isomorphic-fetch')

function rdfFetch (url, options) {
  options = options || {}

  var fetch = options.fetch || rdfFetch.defaults.fetch
  var formats = options.formats || rdfFetch.defaults.formats

  if (!formats) {
    return Promise.reject(new Error('no formats given'))
  }

  options.headers = options.headers || {}
  options.headers.Accept = formats.parsers.list().join(', ')

  return Promise.resolve().then(function () {
    if (options.body) {
      var reqContentType = options.headers && (options.headers['content-type'] || options.headers['Content-Type'])
      var bodyContentType = reqContentType || rdfFetch.defaults.contentType || formats.serializers.list().shift()

      options.headers['Content-Type'] = bodyContentType

      return formats.serializers.serialize(bodyContentType, options.body).then(function (body) {
        options.body = body
      })
    }
  }).then(function () {
    return fetch(url, options)
  }).then(function (res) {
    return res.text().then(function (body) {
      var responseContentType = options.defaultContentType || rdfFetch.defaults.defaultContentType || formats.parsers.list().shift()

      if (res.headers.has('content-type')) {
        responseContentType = res.headers.get('content-type').split(';').shift()
      }

      return formats.parsers.parse(responseContentType, body, null, url)
    }).then(function (graph) {
      res.graph = graph

      return res
    })
  })
}

rdfFetch.defaults = {
  fetch: isomorphicFetch
}

module.exports = rdfFetch
