'use strict'

const nodeifyFetch = require('nodeify-fetch')
const EventEmitter = require('events').EventEmitter

function rdfFetch (url, options) {
  options = options || {}

  let fetch = options.fetch || rdfFetch.defaults.fetch
  let formats = options.formats || rdfFetch.defaults.formats

  if (!formats) {
    return Promise.reject(new Error('no formats given'))
  }

  options.headers = options.headers || {}
  options.headers.Accept = options.headers.accept || options.headers.Accept || formats.parsers.list().join(', ')

  return Promise.resolve().then(() => {
    if (typeof options.body === 'string') {
      return
    }

    if (options.body) {
      let reqContentType = options.headers && (options.headers['content-type'] || options.headers['Content-Type'])
      let bodyContentType = reqContentType || rdfFetch.defaults.contentType || formats.serializers.list().shift()

      options.headers['Content-Type'] = bodyContentType

      let serializer = formats.serializers.find(bodyContentType)

      serializer.import(options.body)

      options.body = serializer
    }
  }).then(() => {
    return fetch(url, options)
  }).then((res) => {
    if (res.status === 204) {
      return res
    }

    return res.text().then((body) => {
      let responseContentType = options.defaultContentType || rdfFetch.defaults.defaultContentType || formats.parsers.list().shift()

      if (res.headers.has('content-type')) {
        responseContentType = res.headers.get('content-type').split(';').shift()
      }

      // TODO: replace with streaming body
      let bodyStream = new EventEmitter()
      let stream = formats.parsers.read(responseContentType, bodyStream, null, url)

      bodyStream.emit('data', body)
      bodyStream.emit('end')

      return stream
    }).then((graph) => {
      res.graph = graph

      return res
    })
  })
}

rdfFetch.defaults = {
  fetch: nodeifyFetch
}

module.exports = rdfFetch
