import { rejects, strictEqual } from 'assert'
import dataModel from '@rdfjs/data-model'
import formats from '@rdfjs/formats/pretty.js'
import SinkMap from '@rdfjs/sink-map'
import { describe, it } from 'mocha'
import { Readable } from 'readable-stream'
import rdfFetch, { Headers } from '../index.js'
import example from './support/example.js'
import simpleServer from './support/simpleServer.js'

describe('request', () => {
  it('should fetch the defined resource', async () => {
    const context = await simpleServer(async ({ baseUrl }) => {
      await rdfFetch(baseUrl, { formats })
    }, {
      '/': {}
    })

    strictEqual(context.resources['/'].touched, true)
  })

  it('should use the given fetch function', async () => {
    let touched = false

    await rdfFetch('', {
      fetch: () => {
        touched = true

        return Promise.resolve({ headers: new Map() })
      },
      formats
    })

    strictEqual(touched, true)
  })

  it('should use the given accept header given as Headers object', async () => {
    const context = await simpleServer(async ({ baseUrl }) => {
      await rdfFetch(baseUrl, {
        formats,
        headers: new Headers({
          accept: 'text/html'
        })
      })
    }, {
      '/': {}
    })

    strictEqual(context.resources['/'].req.headers.accept, 'text/html')
  })

  it('should use the given accept header given as plain object', async () => {
    const context = await simpleServer(async ({ baseUrl }) => {
      await rdfFetch(baseUrl, {
        formats,
        headers: {
          accept: 'text/html'
        }
      })
    }, {
      '/': {}
    })

    strictEqual(context.resources['/'].req.headers.accept, 'text/html')
  })

  it('should build an accept header based on the given parsers', async () => {
    const context = await simpleServer(async ({ baseUrl }) => {
      const customFormats = {
        parsers: new SinkMap([
          ['application/ld+json', { import: () => {} }],
          ['text/turtle', { import: () => {} }]
        ])
      }

      await rdfFetch(baseUrl, { formats: customFormats })
    }, {
      '/': {}
    })

    strictEqual(context.resources['/'].req.headers.accept, 'application/ld+json, text/turtle')
  })

  it('should forward a string body without changes', async () => {
    const context = await simpleServer(async ({ baseUrl }) => {
      await rdfFetch(baseUrl, { formats, method: 'POST', body: 'test' })
    }, {
      '/': {
        method: 'POST'
      }
    })

    strictEqual(context.resources['/'].req.content, 'test')
  })

  it('should serialize a stream body using the serializer given in the content-type header as Headers object', async () => {
    const context = await simpleServer(async ({ baseUrl }) => {
      await rdfFetch(baseUrl, {
        formats,
        method: 'POST',
        headers: new Headers({
          'content-type': 'application/n-triples'
        }),
        body: Readable.from(example.dataset)
      })
    }, {
      '/': {
        method: 'POST'
      }
    })

    strictEqual(context.resources['/'].req.content, example.quadNt)
  })

  it('should serialize a stream body using the serializer given in the content-type header as plain object', async () => {
    const context = await simpleServer(async ({ baseUrl }) => {
      await rdfFetch(baseUrl, {
        formats,
        method: 'POST',
        headers: {
          'content-type': 'application/n-triples'
        },
        body: Readable.from(example.dataset)
      })
    }, {
      '/': {
        method: 'POST'
      }
    })

    strictEqual(context.resources['/'].req.content, example.quadNt)
  })

  it('should throw an error if there is no serializer for the given content-type header', async () => {
    await rejects(async () => {
      await simpleServer(async ({ baseUrl }) => {
        await rdfFetch(baseUrl, {
          formats,
          headers: {
            'content-type': 'text/plain'
          },
          body: Readable.from(example.dataset)
        })
      })
    }, {
      message: /text\/plain/
    })
  })

  it('should use the first serializer found to serialize the body if no content type was defined', async () => {
    const context = await simpleServer(async ({ baseUrl }) => {
      const stream = Readable.from(['test'])

      const customFormats = {
        parsers: new SinkMap(),
        serializers: new SinkMap([
          ['text/turtle', { import: () => stream }],
          ['application/ld+json', { import: () => {} }]
        ])
      }

      await rdfFetch(baseUrl, {
        formats: customFormats,
        method: 'POST',
        body: Readable.from(example.dataset)
      })
    }, {
      '/': {
        method: 'POST'
      }
    })

    strictEqual(context.resources['/'].req.headers['content-type'], 'text/turtle')
    strictEqual(context.resources['/'].req.content, 'test')
  })

  it('should serialize a iterable', async () => {
    const context = await simpleServer(async ({ baseUrl }) => {
      await rdfFetch(baseUrl, {
        formats,
        method: 'POST',
        headers: {
          'content-type': 'application/n-triples'
        },
        body: example.dataset
      })
    }, {
      '/': {
        method: 'POST'
      }
    })

    strictEqual(context.resources['/'].req.content, example.quadNt)
  })

  it('should serialize a iterable with the given prefixes', async () => {
    const context = await simpleServer(async ({ baseUrl }) => {
      const prefixes = new Map([
        ['ex', dataModel.namedNode('http://example.org/')]
      ])

      await rdfFetch(baseUrl, {
        formats,
        method: 'POST',
        headers: {
          'content-type': 'text/turtle'
        },
        body: example.dataset,
        prefixes
      })
    }, {
      '/': {
        method: 'POST'
      }
    })

    strictEqual(context.resources['/'].req.content, example.quadTtl)
  })
})
