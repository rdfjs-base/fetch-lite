const nodeifyFetch = require('nodeify-fetch')
const patchRequest = require('./lib/patch-request')
const patchResponse = require('./lib/patch-response')

function rdfFetch (url, options) {
  options = options || {}
  options.headers = options.headers || {}

  let context = {
    url: url,
    options: options,
    defaults: rdfFetch.defaults,
    fetch: options.fetch || rdfFetch.defaults.fetch,
    formats: options.formats || rdfFetch.defaults.formats
  }

  if (!context.formats) {
    return Promise.reject(new Error('no formats given'))
  }

  return patchRequest(context).then(() => {
    return context.fetch(context.url, context.options)
  }).then((res) => {
    return patchResponse(context, res)
  })
}

rdfFetch.defaults = {
  fetch: nodeifyFetch
}

module.exports = rdfFetch
