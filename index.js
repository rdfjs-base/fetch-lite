import nodeifyFetch, { Headers } from 'nodeify-fetch'
import patchRequest from './lib/patchRequest.js'
import patchResponse from './lib/patchResponse.js'

async function rdfFetch (url, options = {}) {
  const factory = options.factory
  const fetch = options.fetch || nodeifyFetch
  const formats = options.formats

  if (!formats) {
    throw new Error('no formats given')
  }

  options = patchRequest(options, formats)

  const res = await fetch(url, options)

  return patchResponse(res, factory, fetch, formats.parsers)
}

export {
  rdfFetch as default,
  Headers
}
