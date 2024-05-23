import { deepStrictEqual, rejects, strictEqual } from 'assert'
import rdfDataset from '@rdfjs/dataset'
import formats from '@rdfjs/formats'
import SinkMap from '@rdfjs/sink-map'
import { isReadableStream } from 'is-stream'
import { describe, it } from 'mocha'
import { Readable } from 'readable-stream'
import { chunks, decode } from 'stream-chunks'
import rdfFetch from '../index.js'
import example from './support/example.js'
import simpleServer from './support/simpleServer.js'

describe('response', () => {
  describe('quadStream', () => {
    it('should be a function', async () => {
      await simpleServer(async ({ baseUrl }) => {
        const res = await rdfFetch(baseUrl, { formats })

        strictEqual(typeof res.quadStream, 'function')
      })
    })

    it('should handle an empty response body', async () => {
      await simpleServer(async ({ baseUrl }) => {
        const res = await rdfFetch(baseUrl, { formats })
        const quadStream = await res.quadStream()
        const quads = await chunks(quadStream)

        deepStrictEqual(quads, [])
      }, {
        '/': {
          content: null,
          contentType: 'text/turtle'
        }
      })
    })

    it('should detect a response body base on transfer-encoding header', async () => {
      await simpleServer(async ({ baseUrl }) => {
        const res = await rdfFetch(baseUrl, { formats })

        strictEqual(typeof res.quadStream, 'function')
      }, {
        '/': {
          content: null,
          headers: {
            'transfer-encoding': 'chunked'
          }
        }
      })
    })

    it('should detect a response body base on content-* headers', async () => {
      await simpleServer(async ({ baseUrl }) => {
        const res = await rdfFetch(baseUrl, { formats })

        strictEqual(typeof res.quadStream, 'function')
      }, {
        '/': {
          content: ' ',
          contentType: 'text/turtle'
        }
      })
    })

    it('should return a stream', async () => {
      await simpleServer(async ({ baseUrl }) => {
        const res = await rdfFetch(baseUrl, { formats })
        const quadStream = await res.quadStream()

        strictEqual(isReadableStream(quadStream), true)

        await chunks(quadStream)
      }, {
        '/': {
          content: example.quadNt,
          contentType: 'text/turtle'
        }
      })
    })

    it('should stream quads', async () => {
      await simpleServer(async ({ baseUrl }) => {
        const res = await rdfFetch(baseUrl, { formats })
        const quadStream = await res.quadStream()
        const quads = await chunks(quadStream)

        strictEqual(example.quad.equals(quads[0]), true)
      }, {
        '/': {
          content: example.quadNt,
          contentType: 'text/turtle'
        }
      })
    })

    it('should read the content type from the response headers', async () => {
      await simpleServer(async ({ baseUrl }) => {
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

        const res = await rdfFetch(baseUrl, { formats: customFormats })
        await res.quadStream()

        strictEqual(touched, true)
      }, {
        '/': {
          content: example.quadNt,
          contentType: 'text/turtle; charset=utf-8'
        }
      })
    })

    it('should throw an error if there is no parser for the content type', async () => {
      await rejects(async () => {
        await simpleServer(async ({ baseUrl }) => {
          const res = await rdfFetch(baseUrl, { formats })
          await res.quadStream()
        }, {
          '/': {
            content: 'text',
            contentType: 'text/plain'
          }
        })
      }, {
        message: /text\/plain/
      })
    })

    it('should call the parser with all required parameters to parse the response', async () => {
      const content = 'content'
      const contentType = 'application/n-triples'

      await simpleServer(async ({ baseUrl }) => {
        let actual = null

        const customImport = async (stream, options) => {
          deepStrictEqual(options, {
            baseIRI: baseUrl,
            context: undefined
          })

          actual = await decode(stream)

          const quadStream = new Readable({
            read: () => {
              quadStream.push(null)
            }
          })

          return quadStream
        }

        const customFormats = {
          parsers: new SinkMap([[
            contentType, { import: customImport }
          ]])
        }

        const res = await rdfFetch(baseUrl, { formats: customFormats })
        await res.quadStream()

        strictEqual(actual, content)
      }, {
        '/': {
          content,
          contentType
        }
      })
    })
  })

  describe('dataset', () => {
    it('should throw if response is missing Content-Type header', async () => {
      await rejects(async () => {
        await simpleServer(async ({ baseUrl }) => {
          const res = await rdfFetch(baseUrl, { formats })
          await res.quadStream()
        }, {
          '/': {
            content: 'content',
            contentType: null
          }
        })
      }, {
        message: /Content-Type/
      })
    })

    it('should be able to explicitly handle missing Content-Type header', async () => {
      await simpleServer(async ({ baseUrl }) => {
        const res = await rdfFetch(baseUrl, { factory: rdfDataset, formats })

        // If we know in advance that a server doesn't provide an HTTP Content-Type header
        // then we can provide it explicitly ourselves...
        res.headers.set('content-type', 'application/n-triples')

        const dataset = await res.dataset()
        strictEqual(typeof dataset.add, 'function')
      }, {
        '/': {
          content: example.quadNt,
          contentType: null
        }
      })
    })

    it('should be undefined if no factory is given', async () => {
      await simpleServer(async ({ baseUrl }) => {
        const res = await rdfFetch(baseUrl, { formats })

        strictEqual(typeof res.dataset, 'undefined')
      })
    })

    it('should be a function', async () => {
      await simpleServer(async context => {
        const res = await rdfFetch(context.baseUrl, { factory: rdfDataset, formats })

        strictEqual(typeof res.dataset, 'function')
      })
    })

    it('should handle an empty response body', async () => {
      await simpleServer(async context => {
        const res = await rdfFetch(context.baseUrl, { factory: rdfDataset, formats })
        const dataset = await res.dataset()

        strictEqual(dataset.size, 0)
      }, {
        '/': {
          content: null,
          contentType: 'text/turtle'
        }
      })
    })

    it('should detect a response body base on transfer-encoding header', async () => {
      await simpleServer(async context => {
        const res = await rdfFetch(context.baseUrl, { factory: rdfDataset, formats })

        strictEqual(typeof res.dataset, 'function')
      }, {
        '/': {
          content: null,
          headers: {
            'transfer-encoding': 'chunked'
          }
        }
      })
    })

    it('should detect a response body base on content-* headers', async () => {
      await simpleServer(async context => {
        const res = await rdfFetch(context.baseUrl, { factory: rdfDataset, formats })

        strictEqual(typeof res.dataset, 'function')
      }, {
        '/': {
          content: example.quadNt,
          contentType: 'text/turtle'
        }
      })
    })

    it('should return a Dataset', async () => {
      await simpleServer(async context => {
        const res = await rdfFetch(context.baseUrl, { factory: rdfDataset, formats })
        const dataset = await res.dataset()

        strictEqual(typeof dataset.add, 'function')
      }, {
        '/': {
          content: example.quadNt,
          contentType: 'text/turtle'
        }
      })
    })

    it('should return a Dataset which contains the parsed content', async () => {
      await simpleServer(async context => {
        const res = await rdfFetch(context.baseUrl, { factory: rdfDataset, formats })
        const dataset = await res.dataset()

        strictEqual(dataset.size, 1)
        strictEqual(example.quad.equals([...dataset][0]), true)
      }, {
        '/': {
          content: example.quadNt,
          contentType: 'text/turtle'
        }
      })
    })

    it('should return an empty Dataset if there is no quad in the content', async () => {
      const content = '\n'

      await simpleServer(async context => {
        const res = await rdfFetch(context.baseUrl, { factory: rdfDataset, formats })
        const dataset = await res.dataset()

        strictEqual(dataset.size, 0)
      }, {
        '/': {
          content,
          contentType: 'text/turtle'
        }
      })
    })
  })

  describe('JSON-LD context', () => {
    it('should fetch the context given in the Link header', async () => {
      const context = await simpleServer(async context => {
        const res = await rdfFetch(context.baseUrl, { formats })
        await res.quadStream()
      }, {
        '/': {
          content: {},
          contentType: 'application/json',
          headers: {
            link: ({ url }) => `<${url}context>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`
          }
        },
        '/context': {
          content: {}
        }
      })

      strictEqual(context.resources['/context'].touched, true)
    })

    it('should not fetch the context given in the Link header if the content type is application/ld+json', async () => {
      const context = await simpleServer(async context => {
        const res = await rdfFetch(context.baseUrl, { formats })
        await res.quadStream()
      }, {
        '/': {
          content: {},
          contentType: 'application/ld+json',
          headers: {
            link: ({ url }) => `<${url}context>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`
          }
        },
        '/context': {
          content: {}
        }
      })

      strictEqual(context.resources['/context'].touched, false)
    })

    it('should use the context given in the Link header', async () => {
      const content = {
        '@id': 'http://example.org/subject',
        predicate: 'object'
      }

      const contentContext = {
        '@vocab': 'http://example.org/'
      }

      await simpleServer(async context => {
        const res = await rdfFetch(context.baseUrl, { formats })
        const quadStream = await res.quadStream()
        const quads = await chunks(quadStream)

        strictEqual(example.quad.equals(quads[0]), true)
      }, {
        '/': {
          content,
          headers: {
            link: ({ url }) => `<${url}context>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`
          }
        },
        '/context': {
          content: contentContext
        }
      })
    })
  })
})
