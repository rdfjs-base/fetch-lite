import { deepStrictEqual, rejects, strictEqual } from 'assert'
import formats from '@rdfjs/formats-common'
import SinkMap from '@rdfjs/sink-map'
import { describe, it } from 'mocha'
import { Readable } from 'readable-stream'
import rdfFetch from '../index.js'
import toStream from '../lib/toStream.js'
import example from './support/example.js'
import virtualResource from './support/virtualResource.js'

describe('request', () => {
  it('should fetch the defined resource', async () => {
    const id = '/request/fetch'

    const result = virtualResource({ id })

    await rdfFetch(`http://example.org${id}`, { formats })

    strictEqual(result.touched, true)
  })

  it('should use the given fetch function', async () => {
    let touched = false

    await rdfFetch('', {
      fetch: () => {
        touched = true

        return Promise.resolve({ headers: new Map() })
      },
      formats: formats
    })

    strictEqual(touched, true)
  })

  it('should use the given accept header', async () => {
    const id = '/request/accept-header'

    const result = virtualResource({ id })

    await rdfFetch(`http://example.org${id}`, {
      formats,
      headers: {
        accept: 'text/html'
      }
    })

    deepStrictEqual(result.headers.accept, 'text/html')
  })

  it('should build an accept header based on the given parsers', async () => {
    const id = '/request/accept-parsers'

    const result = virtualResource({ id })

    const customFormats = {
      parsers: new SinkMap([
        ['application/ld+json', { import: () => {} }],
        ['text/turtle', { import: () => {} }]
      ])
    }

    await rdfFetch(`http://example.org${id}`, { formats: customFormats })

    deepStrictEqual(result.headers.accept, 'application/ld+json, text/turtle')
  })

  it('should forward a string body without changes', async () => {
    const id = '/request/string'

    const result = virtualResource({ method: 'POST', id })

    await rdfFetch(`http://example.org${id}`, { formats, method: 'POST', body: 'test' })

    strictEqual(result.content, 'test')
  })

  it('should serialize a stream body using the serializer given in the content-type header', async () => {
    const id = '/request/stream'

    const result = virtualResource({ method: 'POST', id })

    await rdfFetch(`http://example.org${id}`, {
      formats,
      method: 'POST',
      headers: {
        'content-type': 'application/n-triples'
      },
      body: toStream(example.dataset)
    })

    strictEqual(result.content, example.quadNt)
  })

  it('should throw an error if there is no serializer for the given content-type header', async () => {
    const id = '/request/serializer-not-found'

    virtualResource({ id })

    await rejects(async () => {
      await rdfFetch(`http://example.org${id}`, {
        formats,
        headers: {
          'content-type': 'text/plain'
        },
        body: toStream(example.dataset)
      })
    })
  })

  it('should use the first serializer found to serialize the body if no content type was defined', async () => {
    const id = '/request/serializer-first'

    const result = virtualResource({ method: 'POST', id })

    const stream = new Readable({
      read: () => {
        stream.push('test')
        stream.push(null)
      }
    })

    const customFormats = {
      parsers: new SinkMap(),
      serializers: new SinkMap([
        ['text/turtle', {
          import: () => {
            return stream
          }
        }],
        ['application/ld+json', { import: () => {} }]
      ])
    }

    await rdfFetch(`http://example.org${id}`, {
      formats: customFormats,
      method: 'POST',
      body: toStream(example.dataset)
    })

    deepStrictEqual(result.headers['content-type'], 'text/turtle')
    strictEqual(result.content, 'test')
  })

  it('should serialize a iterable', async () => {
    const id = '/request/iterable'

    const result = virtualResource({ method: 'POST', id })

    await rdfFetch(`http://example.org${id}`, {
      formats,
      method: 'POST',
      headers: {
        'content-type': 'application/n-triples'
      },
      body: example.dataset
    })

    strictEqual(result.content, example.quadNt)
  })
})
