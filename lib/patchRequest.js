const headersToLowerCase = require('./headersToLowerCase')

function patchRequest (options, formats) {
  options.headers = headersToLowerCase(options.headers || {})

  // if no accept header is defined, list all of the parsers map
  options.headers.accept = options.headers.accept || [...formats.parsers.keys()].join(', ')

  // nothing to do if there is no content to send
  if (!options.body) {
    return options
  }

  // don't touch string content
  if (typeof options.body === 'string') {
    return options
  }

  // content-type defined, but not serialize for the media type available?
  if (options.headers['content-type'] && !formats.serializers.has(options.headers['content-type'])) {
    throw new Error(`no serializer found for media type: ${options.headers['content-type']}`)
  }

  // if no content-type was defined, use the first in the serializer map
  options.headers['content-type'] = options.headers['content-type'] || formats.serializers.keys().next().value

  // replace body quad stream with the serializer stream
  options.body = formats.serializers.import(options.headers['content-type'], options.body)

  return options
}

module.exports = patchRequest
