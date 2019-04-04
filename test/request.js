/* global describe, it */

const assert = require('assert')
const example = require('./support/example')
const expectError = require('./support/expectError')
const formats = require('@rdfjs/formats-common')
const rdfFetch = require('..')
const toStream = require('../lib/toStream')
const virtualResource = require('./support/virtualResource')
const Readable = require('readable-stream')
const SinkMap = require('@rdfjs/sink-map')

describe('request', () => {
  it('should fetch the defined resource', () => {
    const id = '/request/fetch'

    const result = virtualResource({ id })

    return rdfFetch(`http://example.org${id}`, { formats }).then(() => {
      assert(result.touched)
    })
  })

  it('should use the given fetch function', () => {
    let touched = false

    return rdfFetch('', {
      fetch: () => {
        touched = true

        return Promise.resolve({})
      },
      formats: formats
    }).then(() => {
      assert(touched)
    })
  })

  it('should use the given accept header', () => {
    const id = '/request/accept-header'

    const result = virtualResource({ id })

    return rdfFetch(`http://example.org${id}`, {
      formats,
      headers: {
        accept: 'text/html'
      }
    }).then(() => {
      assert.deepStrictEqual(result.headers.accept, ['text/html'])
    })
  })

  it('should build an accept header based on the given parsers', () => {
    const id = '/request/accept-parsers'

    const result = virtualResource({ id })

    const customFormats = {
      parsers: new SinkMap([
        ['application/ld+json', { import: () => {} }],
        ['text/turtle', { import: () => {} }]
      ])
    }

    return rdfFetch(`http://example.org${id}`, { formats: customFormats }).then(() => {
      assert.deepStrictEqual(result.headers.accept, ['application/ld+json, text/turtle'])
    })
  })

  it('should forward a string body without changes', () => {
    const id = '/request/string'

    const result = virtualResource({ id })

    return rdfFetch(`http://example.org${id}`, { formats, body: 'test' }).then(() => {
      assert.strictEqual(result.content, 'test')
    })
  })

  it('should serialize a stream body using the serializer given in the content-type header', () => {
    const id = '/request/stream'

    const result = virtualResource({ id })

    return rdfFetch(`http://example.org${id}`, {
      formats,
      headers: {
        'content-type': 'application/n-triples'
      },
      body: toStream(example.dataset)
    }).then(() => {
      assert.strictEqual(result.content, example.quadNt)
    })
  })

  it('should throw an error if there is no serializer for the given content-type header', () => {
    const id = '/request/serializer-not-found'

    virtualResource({ id })

    return expectError(() => {
      rdfFetch(`http://example.org${id}`, {
        formats,
        headers: {
          'content-type': 'text/plain'
        },
        body: toStream(example.dataset)
      })
    })
  })

  it('should use the first serializer found to serialize the body if no content type was defined', () => {
    const id = '/request/serializer-first'

    const result = virtualResource({ id })

    const stream = new Readable({
      read: () => {
        stream.push('test')
        stream.push(null)
      }
    })

    const customFormats = {
      parsers: new SinkMap(),
      serializers: new SinkMap([
        ['text/turtle', { import: () => { return stream } }],
        ['application/ld+json', { import: () => {} }]
      ])
    }

    return rdfFetch(`http://example.org${id}`, {
      formats: customFormats,
      body: toStream(example.dataset)
    }).then(() => {
      assert.deepStrictEqual(result.headers['content-type'], ['text/turtle'])
      assert.strictEqual(result.content, 'test')
    })
  })

  it('should serialize a iterable', () => {
    const id = '/request/iterable'

    const result = virtualResource({ id })

    return rdfFetch(`http://example.org${id}`, {
      formats,
      headers: {
        'content-type': 'application/n-triples'
      },
      body: example.dataset
    }).then(() => {
      assert.strictEqual(result.content, example.quadNt)
    })
  })
})
