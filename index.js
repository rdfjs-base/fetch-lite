const nodeifyFetch = require('nodeify-fetch')
const patchRequest = require('./lib/patchRequest')
const patchResponse = require('./lib/patchResponse')

function rdfFetch (url, options = {}) {
  const factory = options.factory
  const fetch = options.fetch || nodeifyFetch
  const formats = options.formats

  if (!formats) {
    return Promise.reject(new Error('no formats given'))
  }

  options = patchRequest(options, formats)

  return fetch(url, options).then(res => {
    return patchResponse(res, factory, fetch, formats.parsers)
  })
}

rdfFetch.Headers = nodeifyFetch.Headers

module.exports = rdfFetch
