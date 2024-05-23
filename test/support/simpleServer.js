import { text } from 'express'
import withServer from 'express-as-promise/withServer.js'

function middlewareFactory ({ baseUrl, content, contentType, context, headers = {}, path }) {
  return (req, res) => {
    context.url = new URL(path, baseUrl)
    context.touched = true
    context.req = {
      content: req.body,
      headers: req.headers
    }
    context.res = {
      content,
      headers
    }

    if (contentType) {
      context.res.headers['content-type'] = contentType
    }

    for (const [key, value] of Object.entries(context.res.headers)) {
      if (typeof value === 'function') {
        res.set(key, value(context))
      } else {
        res.set(key, value)
      }
    }

    if (content) {
      let result = content

      if (typeof content === 'function') {
        result = content(context)
      }

      if (typeof result === 'object') {
        res.json(result)
      } else {
        res.end(result)
      }
    } else {
      res.status(201).end()
    }
  }
}

async function simpleServer (func, resources = {}) {
  const context = {
    resources: {}
  }

  for (const path of Object.keys(resources)) {
    context.resources[path] = {
      touched: false
    }
  }

  await withServer(async server => {
    context.baseUrl = (await server.listen()).toString()

    for (const [path, config] of Object.entries(resources)) {
      const middleware = middlewareFactory({
        ...config,
        baseUrl: context.baseUrl,
        context: context.resources[path],
        path
      })

      if (config.method === 'POST') {
        server.app.post(path, text({ type: '*/*' }), middleware)
      } else {
        server.app.get(path, middleware)
      }
    }

    await func(context)
  })

  return context
}

export default simpleServer
