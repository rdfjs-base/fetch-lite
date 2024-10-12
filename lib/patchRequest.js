import { isReadableStream } from 'is-stream'
import { Headers } from 'nodeify-fetch'
import { Readable } from 'readable-stream'

function patchRequest (options, formats) {
  options.headers = new Headers(options.headers)

  // if no accept header is defined, list all of the parsers map
  if (!options.headers.has('accept')) {
    options.headers.set('accept', [...formats.parsers.keys()].join(', '))
  }

  // nothing to do if there is no content to send
  if (!options.body) {
    return options
  }

  // don't touch string content
  if (typeof options.body === 'string') {
    return options
  }

  // content-type defined but no serializer available for the media type available
  let contentType = options.headers.get('content-type')

  if (contentType && !formats.serializers.has(contentType)) {
    throw new Error(`no serializer found for media type: ${options.headers.get('content-type')}`)
  }

  // if no content-type was defined, use the first in the serializer map
  if (!contentType) {
    contentType = formats.serializers.keys().next().value

    options.headers.set('content-type', contentType)
  }

  // if body is an iterable, replace it with a stream
  if (!isReadableStream(options.body) && options.body[Symbol.iterator]) {
    options.body = Readable.from(options.body)
  }

  // replace body quad stream with the serializer stream
  options.body = formats.serializers.import(contentType, options.body, { prefixes: options.prefixes })

  return options
}

export default patchRequest
