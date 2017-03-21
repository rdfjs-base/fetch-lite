function patchRequest (context) {
  context.options.headers.accept = context.options.headers.accept ||
    context.options.headers.Accept ||
    context.formats.parsers.list().join(', ')

  // make sure there is only once accept header
  context.options.headers.Accept = undefined

  if (!context.options.body) {
    return Promise.resolve()
  }

  if (typeof context.options.body === 'string') {
    return Promise.resolve()
  }

  let contentType = context.options.headers &&
    (context.options.headers['content-type'] || context.options.headers['Content-Type'])
  contentType = contentType ||
    context.defaults.contentType ||
    context.formats.serializers.list().shift()

  context.options.headers['Content-Type'] = contentType

  context.options.body = context.formats.serializers.find(contentType).import(context.options.body)

  return Promise.resolve()
}

module.exports = patchRequest
