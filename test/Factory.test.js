import { strictEqual } from 'assert'
import DataFactory from '@rdfjs/data-model/Factory.js'
import DatasetFactory from '@rdfjs/dataset/Factory.js'
import Environment from '@rdfjs/environment'
import formats from '@rdfjs/formats'
import FormatsFactory from '@rdfjs/formats/Factory.js'
import SinkMap from '@rdfjs/sink-map'
import toNT from '@rdfjs/to-ntriples'
import withServer from 'express-as-promise/withServer.js'
import { describe, it } from 'mocha'
import nodeFetch from 'nodeify-fetch'
import FetchFactory from '../Factory.js'
import { Headers } from '../index.js'
import example from './support/example.js'

describe('FetchFactory', () => {
  it('should be a constructor', () => {
    strictEqual(typeof FetchFactory, 'function')
  })

  describe('.clone', () => {
    it('should copy the key-value pairs of the config', () => {
      const env = new Environment([FetchFactory])
      env._fetch.a = '1'
      env._fetch.b = {}

      const clone = env.clone()

      strictEqual(clone._fetch.a, env._fetch.a)
      strictEqual(clone._fetch.b, env._fetch.b)
    })
  })

  describe('.fetch', () => {
    it('should be a method', () => {
      const env = new Environment([FetchFactory])

      strictEqual(typeof env.fetch, 'function')
    })

    it('should use the DatasetFactory if available', async () => {
      await withServer(async server => {
        let called = false

        class CustomDatasetFactory extends DatasetFactory {
          dataset (quads) {
            called = true

            return super.dataset(quads)
          }
        }

        const env = new Environment([CustomDatasetFactory, DataFactory, FetchFactory, FormatsFactory])
        env.formats.import(formats)

        server.app.get('/', (req, res) => {
          res.set('content-type', 'text/turtle').end(toNT(example.quad))
        })

        const res = await env.fetch(await server.listen())
        await res.dataset()

        strictEqual(called, true)
      })
    })

    it('should work without DatasetFactory', async () => {
      await withServer(async server => {
        const env = new Environment([DataFactory, FetchFactory, FormatsFactory])
        env.formats.import(formats)

        server.app.get('/', (req, res) => {
          res.set('content-type', 'text/turtle').end(toNT(example.quad))
        })

        const res = await env.fetch(await server.listen())

        strictEqual(res.ok, true)
      })
    })

    it('should use the formats from the environment', async () => {
      await withServer(async server => {
        let called = false

        class CustomParser extends formats.parsers.get('text/turtle').constructor {
          import (stream) {
            called = true

            return super.import(stream)
          }
        }

        const env = new Environment([DataFactory, DatasetFactory, FetchFactory, FormatsFactory])
        env.formats.import({
          parsers: new Map([['text/turtle', new CustomParser()]])
        })

        server.app.get('/', (req, res) => {
          res.set('content-type', 'text/turtle').end(toNT(example.quad))
        })

        const res = await env.fetch(await server.listen())
        await res.dataset()

        strictEqual(called, true)
      })
    })

    it('should allow overwriting the formats', async () => {
      await withServer(async server => {
        let called = false

        class CustomParser extends formats.parsers.get('text/turtle').constructor {
          import (stream) {
            called = true

            return super.import(stream)
          }
        }
        const customFormats = {
          parsers: new SinkMap([['text/turtle', new CustomParser()]])
        }

        const env = new Environment([DataFactory, DatasetFactory, FetchFactory, FormatsFactory])
        env.formats.import(formats)

        server.app.get('/', (req, res) => {
          res.set('content-type', 'text/turtle').end(toNT(example.quad))
        })

        const res = await env.fetch(await server.listen(), {
          formats: customFormats
        })
        await res.dataset()

        strictEqual(called, true)
      })
    })

    it('should use an alternative fetch implementation if set in the config', async () => {
      await withServer(async server => {
        let called = false
        const customFetch = (url, options) => {
          called = true

          return nodeFetch(url, options)
        }
        const env = new Environment([DataFactory, FetchFactory, FormatsFactory])
        env.fetch.config('fetch', customFetch)
        env.formats.import(formats)

        server.app.get('/', (req, res) => {
          res.set('content-type', 'text/turtle').end(toNT(example.quad))
        })

        await env.fetch(await server.listen())

        strictEqual(called, true)
      })
    })

    it('should allow overwriting the fetch implementation', async () => {
      await withServer(async server => {
        let called = false
        const customFetch = (url, options) => {
          called = true

          return nodeFetch(url, options)
        }
        const env = new Environment([DataFactory, FetchFactory, FormatsFactory])
        env.formats.import(formats)

        server.app.get('/', (req, res) => {
          res.set('content-type', 'text/turtle').end(toNT(example.quad))
        })

        await env.fetch(await server.listen(), {
          fetch: customFetch
        })

        strictEqual(called, true)
      })
    })
  })

  describe('.fetch.config', () => {
    it('should be a function', () => {
      const env = new Environment([FetchFactory])

      strictEqual(typeof env.fetch.config, 'function')
    })

    it('should change the given config value', () => {
      const value = {}
      const env = new Environment([FetchFactory])

      env.fetch.config('fetch', value)

      strictEqual(env._fetch.fetch, value)
    })
  })

  describe('.fetch.Headers', () => {
    it('should be a constructor', () => {
      const env = new Environment([FetchFactory])

      strictEqual(typeof env.fetch.Headers, 'function')
    })

    it('should be the Headers class from @rdfjs/fetch-lite', () => {
      const env = new Environment([FetchFactory])

      strictEqual(env.fetch.Headers, Headers)
    })
  })
})
