var formats = require('rdf-formats-common')()
var rdfFetchLite = require('./lite')

function rdfFetch (url, options) {
  options = options || {}

  options.fetch = options.fetch || rdfFetch.defaults.fetch
  options.formats = options.formats || rdfFetch.defaults.formats

  return rdfFetchLite(url, options)
}

rdfFetch.defaults = {
  fetch: rdfFetchLite.defaults.fetch,
  formats: formats
}

module.exports = rdfFetch
