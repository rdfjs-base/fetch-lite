/* global describe, it */

const assert = require('assert')
const example = require('./support/example')
const expectError = require('./support/expectError')
const formats = require('@rdfjs/formats-common')
const rdfDataset = require('@rdfjs/dataset')
const rdfFetch = require('..')
const virtualResource = require('./support/virtualResource')
const waitFor = require('../lib/waitFor')
const Readable = require('readable-stream')
const SinkMap = require('@rdfjs/sink-map')

describe('response', () => {
  describe('quadStream', () => {
    it('should be a function', () => {
      const id = '/response/quadstream/function'

      virtualResource({ id })

      return rdfFetch(`http://example.org${id}`, { formats }).then(res => {
        assert.strictEqual(typeof res.quadStream, 'function')
      })
    })

    it('should return a stream', () => {
      const id = '/response/quadstream/stream'
      const content = example.quadNt

      virtualResource({ id, content })

      return rdfFetch(`http://example.org${id}`, { formats }).then(res => res.quadStream()).then(quadStream => {
        const quads = []

        quadStream.on('data', quad => quads.push(quad))

        assert.strictEqual(typeof quadStream.on, 'function')
      })
    })

    it('should stream quads', () => {
      const id = '/response/quadstream/quads'
      const content = example.quadNt

      virtualResource({ id, content })

      return rdfFetch(`http://example.org${id}`, { formats }).then(res => res.quadStream()).then(quadStream => {
        const quads = []

        quadStream.on('data', quad => quads.push(quad))

        return waitFor(quadStream).then(() => {
          assert(example.quad.equals(quads[0]))
        })
      })
    })

    it('should read the content type from the response headers', () => {
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

      return rdfFetch(`http://example.org${id}`, { formats: customFormats }).then(res => res.quadStream()).then(quadStream => {
        assert(touched)
      })
    })

    it('should throw an error if there is no parser for the content type', () => {
      const id = '/response/quadstream/no-parser'
      const content = 'text'
      const contentType = 'text/plain'

      virtualResource({ id, content, contentType })

      return expectError(() => {
        return rdfFetch(`http://example.org${id}`, { formats }).then(res => res.quadStream())
      })
    })

    it('should call the parser with all required parameters to parse the response', () => {
      const id = '/response/quadstream/parameters'
      const content = 'content'

      virtualResource({ id, content })

      const customImport = (stream, options) => {
        assert.deepStrictEqual(options, {
          baseIRI: `http://example.org${id}`,
          context: undefined
        })

        const quadStream = new Readable({
          read: () => {
            quadStream.push(null)
          }
        })

        let content = ''

        stream.on('data', (chunk) => {
          content += chunk
        })

        stream.on('end', () => {
          assert.strictEqual(content, 'content')
        })

        return quadStream
      }

      const customFormats = {
        parsers: new SinkMap([[
          'application/n-triples', { import: customImport }
        ]])
      }

      return rdfFetch(`http://example.org${id}`, { formats: customFormats }).then(res => res.quadStream()).then(quadStream => {})
    })
  })

  describe('dataset', () => {
    it('should throw when dataset factory is missing', async () => {
      const id = '/response/dataset/undefined'

      virtualResource({ id })

      const res = await rdfFetch(`http://example.org${id}`, { formats })
      await res.dataset().then(
        () => Promise.reject(new Error('Expected method to reject.')),
        (err) => {
          assert.strictEqual(err.message, `Missing dataset factory`)
        })
    })

    it('should be a function', () => {
      const id = '/response/dataset/function'

      virtualResource({ id })

      return rdfFetch(`http://example.org${id}`, { factory: rdfDataset, formats }).then(res => {
        assert.strictEqual(typeof res.dataset, 'function')
      })
    })

    it('should return a Dataset', () => {
      const id = '/response/dataset/dataset'

      virtualResource({ id })

      return rdfFetch(`http://example.org${id}`, { factory: rdfDataset, formats }).then(res => res.dataset()).then(dataset => {
        assert.strictEqual(typeof dataset.add, 'function')
      })
    })

    it('should return a Dataset which contains the parsed content', () => {
      const id = '/response/dataset/content'
      const content = example.quadNt

      virtualResource({ id, content })

      return rdfFetch(`http://example.org${id}`, { factory: rdfDataset, formats }).then(res => res.dataset()).then(dataset => {
        assert.strictEqual(dataset.size, 1)
        assert(example.quad.equals([...dataset][0]))
      })
    })

    it('should return an empty Dataset if there is no content', () => {
      const id = '/response/dataset/empty'

      virtualResource({ id })

      return rdfFetch(`http://example.org${id}`, { factory: rdfDataset, formats }).then(res => res.dataset()).then(dataset => {
        assert.strictEqual(dataset.size, 0)
      })
    })
  })

  describe('JSON-LD context', () => {
    it('should fetch the context given in the Link header', () => {
      const id = '/response/jsonld/fetch'
      const idContext = `${id}-context`
      const contentType = 'application/json'
      const headers = {
        'link': `<${idContext}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`
      }

      virtualResource({ id, contentType, headers })

      const result = virtualResource({ id: idContext, content: '{}' })

      return rdfFetch(`http://example.org${id}`, { formats }).then(res => res.quadStream()).then(() => {
        assert(result.touched)
      })
    })

    it('should not fetch the context given in the Link header if the content type is application/ld+json', () => {
      const id = '/response/jsonld/not-fetch'
      const idContext = `${id}-context`
      const contentType = 'application/ld+json'
      const headers = {
        'link': `<${idContext}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`
      }

      virtualResource({ id, contentType, headers })

      const result = virtualResource({ id: idContext, content: '{}' })

      return rdfFetch(`http://example.org${id}`, { formats }).then(res => res.quadStream()).then(() => {
        assert(!result.touched)
      })
    })

    it('should use the context given in the Link header', () => {
      const id = '/response/jsonld/use-link-header'
      const idContext = `${id}-context`
      const contentType = 'application/json'
      const headers = {
        'link': `<${idContext}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`
      }

      const content = JSON.stringify({
        '@id': 'http://example.org/subject',
        'predicate': 'object'
      })

      const contentContext = JSON.stringify({
        '@vocab': 'http://example.org/'
      })

      virtualResource({ id, contentType, headers, content })
      virtualResource({ id: idContext, content: contentContext })

      return rdfFetch(`http://example.org${id}`, { formats }).then(res => res.quadStream()).then(quadStream => {
        const quads = []

        quadStream.on('data', quad => quads.push(quad))

        return waitFor(quadStream).then(() => {
          assert(example.quad.equals(quads[0]))
        })
      })
    })
  })
})
