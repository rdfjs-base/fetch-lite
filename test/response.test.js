const { deepStrictEqual, rejects, strictEqual } = require('assert')
const { describe, it } = require('mocha')
const getStream = require('get-stream')
const { isReadable } = require('isstream')
const rdfDataset = require('@rdfjs/dataset')
const formats = require('@rdfjs/formats-common')
const SinkMap = require('@rdfjs/sink-map')
const Readable = require('readable-stream')
const example = require('./support/example')
const virtualResource = require('./support/virtualResource')
const rdfFetch = require('..')

describe('response', () => {
  describe('quadStream', () => {
    it('should be a function', async () => {
      const id = '/response/quadstream/function'

      virtualResource({ id })

      const res = await rdfFetch(`http://example.org${id}`, { formats })

      strictEqual(typeof res.quadStream, 'function')
    })

    it('should be undefined if there is no response body', async () => {
      const id = '/response/quadstream/undefined'

      virtualResource({ id, content: null })

      const res = await rdfFetch(`http://example.org${id}`, { formats })

      strictEqual(typeof res.quadStream, 'undefined')
    })

    it('should detect a response body base on transfer-encoding header', async () => {
      const id = '/response/quadstream/body-transfer-encoding'

      virtualResource({ id, content: null, headers: { 'transfer-encoding': 'chunked' } })

      const res = await rdfFetch(`http://example.org${id}`, { formats })

      strictEqual(typeof res.quadStream, 'function')
    })

    it('should detect a response body base on content-* headers', async () => {
      const id = '/response/quadstream/body-content-type'

      virtualResource({ id, content: null, headers: { 'content-type': 'text/turtle' } })

      const res = await rdfFetch(`http://example.org${id}`, { formats })

      strictEqual(typeof res.quadStream, 'function')
    })

    it('should return a stream', async () => {
      const id = '/response/quadstream/stream'
      const content = example.quadNt

      virtualResource({ id, content })

      const res = await rdfFetch(`http://example.org${id}`, { formats })
      const quadStream = await res.quadStream()
      await getStream.array(quadStream)

      strictEqual(isReadable(quadStream), true)
    })

    it('should stream quads', async () => {
      const id = '/response/quadstream/quads'
      const content = example.quadNt

      virtualResource({ id, content })

      const res = await rdfFetch(`http://example.org${id}`, { formats })
      const quadStream = await res.quadStream()
      const quads = await getStream.array(quadStream)

      strictEqual(example.quad.equals(quads[0]), true)
    })

    it('should read the content type from the response headers', async () => {
      const id = '/response/quadstream/content-type'
      const content = example.quadNt
      const contentType = 'text/turtle; charset=utf-8'

      virtualResource({ id, content, contentType })

      let touched = false

      const customFormats = {
        parsers: new SinkMap([[
          'text/turtle',
          {
            import: () => {
              touched = true
            }
          }
        ]])
      }

      const res = await rdfFetch(`http://example.org${id}`, { formats: customFormats })
      await res.quadStream()

      strictEqual(touched, true)
    })

    it('should throw an error if there is no parser for the content type', async () => {
      const id = '/response/quadstream/no-parser'
      const content = 'text'
      const contentType = 'text/plain'

      virtualResource({ id, content, contentType })

      await rejects(async () => {
        const res = await rdfFetch(`http://example.org${id}`, { formats })
        await res.quadStream()
      })
    })

    it('should call the parser with all required parameters to parse the response', async () => {
      let actual = null
      const id = '/response/quadstream/parameters'
      const content = 'content'

      virtualResource({ id, content })

      const customImport = async (stream, options) => {
        deepStrictEqual(options, {
          baseIRI: `http://example.org${id}`,
          context: undefined
        })

        actual = await getStream(stream)

        const quadStream = new Readable({
          read: () => {
            quadStream.push(null)
          }
        })

        return quadStream
      }

      const customFormats = {
        parsers: new SinkMap([[
          'application/n-triples', { import: customImport }
        ]])
      }

      const res = await rdfFetch(`http://example.org${id}`, { formats: customFormats })
      await res.quadStream()

      strictEqual(actual, content)
    })
  })

  describe('dataset', () => {
    it('should throw if response is missing Content-Type header', async () => {
      const id = '/does/not/matter'
      virtualResource({ id, contentType: null })

      await rejects(async () => {
        const res = await rdfFetch(`http://example.org${id}`, { formats })
        await res.quadStream()
      }, err => {
        strictEqual(err.message.includes('Content-Type'), true)

        return true
      })
    })

    it('should be able to explicitly handle missing Content-Type header', async () => {
      const id = '/response/dataset/dataset'
      virtualResource({ id, contentType: null })

      const res = await rdfFetch(`http://example.org${id}`, { factory: rdfDataset, formats })

      // If we know in advance that a server doesn't provide a HTTP Content-Type header, then we can
      // provide it explicitly ourselves...
      res.headers.set('content-type', 'application/n-triples')

      const dataset = await res.dataset()
      strictEqual(typeof dataset.add, 'function')
    })

    it('should be undefined if no factory is given', async () => {
      const id = '/response/dataset/undefined'

      virtualResource({ id })

      const res = await rdfFetch(`http://example.org${id}`, { formats })

      strictEqual(typeof res.dataset, 'undefined')
    })

    it('should be a function', async () => {
      const id = '/response/dataset/function'

      virtualResource({ id })

      const res = await rdfFetch(`http://example.org${id}`, { factory: rdfDataset, formats })

      strictEqual(typeof res.dataset, 'function')
    })

    it('should be undefined if there is no response body', async () => {
      const id = '/response/dataset/undefined'

      virtualResource({ id, content: null })

      const res = await rdfFetch(`http://example.org${id}`, { factory: rdfDataset, formats })

      strictEqual(typeof res.dataset, 'undefined')
    })

    it('should detect a response body base on transfer-encoding header', async () => {
      const id = '/response/dataset/body-transfer-encoding'

      virtualResource({ id, content: null, headers: { 'transfer-encoding': 'chunked' } })

      const res = await rdfFetch(`http://example.org${id}`, { factory: rdfDataset, formats })

      strictEqual(typeof res.dataset, 'function')
    })

    it('should detect a response body base on content-* headers', async () => {
      const id = '/response/dataset/body-content-type'

      virtualResource({ id, content: null, headers: { 'content-type': 'text/turtle' } })

      const res = await rdfFetch(`http://example.org${id}`, { factory: rdfDataset, formats })

      strictEqual(typeof res.dataset, 'function')
    })

    it('should return a Dataset', async () => {
      const id = '/response/dataset/dataset'

      virtualResource({ id })

      const res = await rdfFetch(`http://example.org${id}`, { factory: rdfDataset, formats })
      const dataset = await res.dataset()

      strictEqual(typeof dataset.add, 'function')
    })

    it('should return a Dataset which contains the parsed content', async () => {
      const id = '/response/dataset/content'
      const content = example.quadNt

      virtualResource({ id, content })

      const res = await rdfFetch(`http://example.org${id}`, { factory: rdfDataset, formats })
      const dataset = await res.dataset()

      strictEqual(dataset.size, 1)
      strictEqual(example.quad.equals([...dataset][0]), true)
    })

    it('should return an empty Dataset if there is no quad in the content', async () => {
      const id = '/response/dataset/empty'
      const content = '\n'

      virtualResource({ id, content })

      const res = await rdfFetch(`http://example.org${id}`, { factory: rdfDataset, formats })
      const dataset = await res.dataset()

      strictEqual(dataset.size, 0)
    })
  })

  describe('JSON-LD context', () => {
    it('should fetch the context given in the Link header', async () => {
      const id = '/response/jsonld/fetch'
      const idContext = `${id}-context`
      const content = '{}'
      const contentType = 'application/json'
      const headers = {
        link: `<${idContext}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`
      }

      virtualResource({ id, content, contentType, headers })

      const result = virtualResource({ id: idContext, content: '{}' })

      const res = await rdfFetch(`http://example.org${id}`, { formats })
      await res.quadStream()

      strictEqual(result.touched, true)
    })

    it('should not fetch the context given in the Link header if the content type is application/ld+json', async () => {
      const id = '/response/jsonld/not-fetch'
      const idContext = `${id}-context`
      const content = '{}'
      const contentType = 'application/ld+json'
      const headers = {
        link: `<${idContext}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`
      }

      virtualResource({ id, content, contentType, headers })

      const result = virtualResource({ id: idContext, content: '{}' })

      const res = await rdfFetch(`http://example.org${id}`, { formats })
      await res.quadStream()

      strictEqual(!result.touched, true)
    })

    it('should use the context given in the Link header', async () => {
      const id = '/response/jsonld/use-link-header'
      const idContext = `${id}-context`
      const contentType = 'application/json'
      const headers = {
        link: `<${idContext}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`
      }

      const content = JSON.stringify({
        '@id': 'http://example.org/subject',
        predicate: 'object'
      })

      const contentContext = JSON.stringify({
        '@vocab': 'http://example.org/'
      })

      virtualResource({ id, contentType, headers, content })
      virtualResource({ id: idContext, content: contentContext })

      const res = await rdfFetch(`http://example.org${id}`, { formats })
      const quadStream = await res.quadStream()
      const quads = await getStream.array(quadStream)

      strictEqual(example.quad.equals(quads[0]), true)
    })
  })
})
