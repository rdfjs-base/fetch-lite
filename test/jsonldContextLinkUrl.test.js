import { strictEqual } from 'assert'
import { describe, it } from 'mocha'
import jsonldContextLinkUrlTest from '../lib/jsonldContextLinkUrl.js'

describe('jsonldContextLinkUrl', () => {
  it('should be a function', () => {
    strictEqual(typeof jsonldContextLinkUrlTest, 'function')
  })

  it('should return null if the content type is not application/json', () => {
    strictEqual(jsonldContextLinkUrlTest({}, 'text/turtle'), null)
  })

  it('should return null if there is no link header', () => {
    const res = {
      headers: new Map()
    }

    strictEqual(jsonldContextLinkUrlTest(res, 'application/json'), null)
  })

  it('should return null if there is no JSON-LD context link header', () => {
    const res = {
      headers: new Map([[
        'link', '</json-context.hydra>; rel="http://www.w3.org/ns/hydra#api"; type="application/ld+json"'
      ]])
    }

    strictEqual(jsonldContextLinkUrlTest(res, 'application/json'), null)
  })

  it('should return null if the link header is invalid', () => {
    const res = {
      headers: new Map([[
        'link', '/json-context; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
      ]])
    }

    strictEqual(jsonldContextLinkUrlTest(res, 'application/json'), null)
  })

  it('should return the URL of the JSON-LD context link header', () => {
    const res = {
      url: 'http://example.org/resource',
      headers: new Map([[
        'link', '<http://example.org/json-context>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
      ]])
    }

    strictEqual(jsonldContextLinkUrlTest(res, 'application/json'), 'http://example.org/json-context')
  })

  it('should resolve the full URL using req.url', () => {
    const res = {
      url: 'http://example.org/resource',
      headers: new Map([[
        'link', '</json-context>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
      ]])
    }

    strictEqual(jsonldContextLinkUrlTest(res, 'application/json'), 'http://example.org/json-context')
  })

  it('should filter the JSON-LD context link if there are multiple link headers', () => {
    const res = {
      url: 'http://example.org/resource',
      headers: new Map([[
        'link', [
          '<http://example.org/api>; rel="http://www.w3.org/ns/hydra#api"; type="application/ld+json"',
          '<http://example.org/json-context>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
        ].join(', ')
      ]])
    }

    strictEqual(jsonldContextLinkUrlTest(res, 'application/json'), 'http://example.org/json-context')
  })
})
