/* global describe, it */

var assert = require('assert')
var formats = require('rdf-formats-common')()
var nock = require('nock')
var rdf = require('rdf-ext')
var rdfFetch = require('..')
var rdfFetchLite = require('../lite')

describe('rdf-fetch', function () {
  var testGraph = rdf.createGraph([
    rdf.createTriple(
      rdf.createNamedNode('http://example.org/subject'),
      rdf.createNamedNode('http://example.org/predicate'),
      rdf.createLiteral('object')
    )
  ])

  describe('lite', function () {
    it('should be a function', function () {
      assert.equal(typeof rdfFetchLite, 'function')
    })

    it('should have a defaults object', function () {
      assert.equal(typeof rdfFetchLite.defaults, 'object')
    })

    it('should return a Promise object', function () {
      var result = rdfFetchLite()

      assert.equal(typeof result, 'object')
      assert.equal(typeof result.then, 'function')
    })

    it('should throw an error if now formats are given', function () {
      return new Promise(function (resolve, reject) {
        rdfFetchLite('').then(function () {
          reject(new Error('no error thrown'))
        }).catch(function () {
          resolve()
        })
      })
    })

    it('should use fetch given in options', function () {
      return new Promise(function (resolve) {
        rdfFetchLite('', {fetch: resolve, formats: formats})
      })
    })

    it('should use fetch given in defaults', function () {
      var defaultFetch = rdfFetchLite.defaults.fetch

      return new Promise(function (resolve) {
        rdfFetchLite.defaults.fetch = resolve

        rdfFetchLite('', {formats: formats})
      }).then(function () {
        rdfFetchLite.defaults.fetch = defaultFetch
      })
    })

    it('should build an Accept header based on formats given in options', function () {
      nock('http://example.org')
        .get('/accept-header')
        .reply(200, function () {
          assert.equal(this.req.headers.accept, 'application/ld+json, text/turtle')
        })

      var customFormats = {
        parsers: new rdf.Parsers({
          'application/ld+json': {parse: function () {}},
          'text/turtle': {parse: function () {}}
        })
      }

      return rdfFetchLite('http://example.org/accept-header', {formats: customFormats})
    })

    it('should build an Accept header based on formats given in defaults', function () {
      nock('http://example.org')
        .get('/accept-header-defaults')
        .reply(200, function () {
          assert.equal(this.req.headers.accept, 'application/ld+json, text/turtle')
        })

      var customFormats = {
        parsers: new rdf.Parsers({
          'application/ld+json': {parse: function () {}},
          'text/turtle': {parse: function () {}}
        })
      }

      rdfFetchLite.defaults.formats = customFormats

      return rdfFetchLite('http://example.org/accept-header-defaults').then(function () {
        rdfFetchLite.defaults.formats = null
      })
    })

    it('should use the content type given in options to serialize the body', function () {
      nock('http://example.org')
        .post('/body-content-type')
        .reply(function (url, body) {
          assert.equal(this.req.headers['content-type'], 'application/n-triples')
          assert.equal(body, '<http://example.org/subject> <http://example.org/predicate> "object" .\n')

          return [200, '', {'Content-Type': 'application/n-triples'}]
        })

      return rdfFetchLite('http://example.org/body-content-type', {method: 'post', headers: {'Content-Type': 'application/n-triples'}, body: testGraph, formats: formats})
    })

    it('should use the content type given in defaults to serialize the body', function () {
      nock('http://example.org')
        .post('/body-content-type-defaults')
        .reply(function (url, body) {
          assert.equal(this.req.headers['content-type'], 'application/n-triples')
          assert.equal(body, '<http://example.org/subject> <http://example.org/predicate> "object" .\n')

          return [200, '', {'Content-Type': 'application/n-triples'}]
        })

      rdfFetchLite.defaults.contentType = 'application/n-triples'

      return rdfFetchLite('http://example.org/body-content-type-defaults', {method: 'post', body: testGraph, formats: formats}).then(function () {
        rdfFetchLite.defaults.contentType = null
      })
    })

    it('should use the content type of the first serializer found to serialize the body if no content type was defined', function () {
      nock('http://example.org')
        .post('/body-content-type-formats')
        .reply(function (url, body) {
          assert.equal(this.req.headers['content-type'], 'application/ld+json')
          assert.equal(body, '[{"@id":"http://example.org/subject","http://example.org/predicate":"object"}]')

          return [200, '', {'Content-Type': 'application/n-triples'}]
        })

      return rdfFetchLite('http://example.org/body-content-type-formats', {method: 'post', body: testGraph, formats: formats})
    })

    it('should use the Content-Type header field to find the parsers to parse the response', function () {
      return new Promise(function (resolve, reject) {
        nock('http://example.org')
          .get('/response-content-type')
          .reply(function () {
            return [200, '', {'Content-Type': 'application/n-triples'}]
          })

        var customFormats = {
          parsers: {
            list: function () {
              return []
            },
            parse: function (mediaType) {
              assert.equal(mediaType, 'application/n-triples')

              resolve()
            }
          }
        }

        rdfFetchLite('http://example.org/response-content-type', {formats: customFormats}).catch(reject)
      })
    })

    it('should use the defaultContentType option to find the parsers to parse the response', function () {
      return new Promise(function (resolve, reject) {
        nock('http://example.org')
          .get('/response-content-type-option')
          .reply(function () {
            return [200, '']
          })

        var customFormats = {
          parsers: {
            list: function () {
              return []
            },
            parse: function (mediaType) {
              assert.equal(mediaType, 'application/n-triples')

              resolve()
            }
          }
        }

        rdfFetchLite('http://example.org/response-content-type-option', {formats: customFormats, defaultContentType: 'application/n-triples'}).catch(reject)
      })
    })

    it('should use the defaultContentType defaults to find the parsers to parse the response', function () {
      return new Promise(function (resolve, reject) {
        nock('http://example.org')
          .get('/response-content-type-defaults')
          .reply(function () {
            return [200, '']
          })

        var customFormats = {
          parsers: {
            list: function () {
              return []
            },
            parse: function (mediaType) {
              assert.equal(mediaType, 'application/n-triples')

              resolve()
            }
          }
        }

        rdfFetchLite.defaults.defaultContentType = 'application/n-triples'

        rdfFetchLite('http://example.org/response-content-type-defaults', {formats: customFormats}).then(function () {
          rdfFetchLite.defaults.defaultContentType = null
        }).catch(reject)
      })
    })

    it('should call the parser with all required parameters to parse the response', function () {
      return new Promise(function (resolve, reject) {
        nock('http://example.org')
          .get('/parser-parameters')
          .reply(function () {
            return [200, 'content', {'Content-Type': 'application/n-triples'}]
          })

        var customFormats = {
          parsers: {
            list: function () {
              return []
            },
            parse: function (mediaType, content, callback, url) {
              assert.equal(content, 'content')
              assert.equal(callback, null)
              assert.equal(url, 'http://example.org/parser-parameters')

              resolve()
            }
          }
        }

        rdfFetchLite('http://example.org/parser-parameters', {formats: customFormats}).catch(reject)
      })
    })

    it('should attach the parsed graph to the response', function () {
      nock('http://example.org')
        .get('/graph')
        .reply(function () {
          return [200, 'content', {'Content-Type': 'application/n-triples'}]
        })

      var customFormats = {
        parsers: {
          list: function () {
            return []
          },
          parse: function (mediaType, content, callback, url) {
            return Promise.resolve('graph')
          }
        }
      }

      rdfFetchLite('http://example.org/parser-parameters', {formats: customFormats}).then(function (res) {
        assert.equal(res.graph, 'graph')
      })
    })
  })

  describe('standard', function () {
    it('should be a function', function () {
      assert.equal(typeof rdfFetch, 'function')
    })

    it('should have a defaults object', function () {
      assert.equal(typeof rdfFetch.defaults, 'object')
    })

    it('should return a Promise object', function () {
      var result = rdfFetch()

      assert.equal(typeof result, 'object')
      assert.equal(typeof result.then, 'function')
    })

    it('should use common formats', function () {
      nock('http://example.org')
        .get('/formats-common')
        .reply(200, function () {
          assert.equal(this.req.headers.accept, 'application/ld+json, application/n-triples, application/rdf+xml, application/xhtml+xml, text/html, text/n3, text/turtle')

          return [200, '{}']
        })

      return rdfFetch('http://example.org/formats-common')
    })

    it('should use formats given in options', function () {
      nock('http://example.org')
        .get('/formats-options')
        .reply(200, function () {
          assert.equal(this.req.headers.accept, 'application/ld+json, text/turtle')
        })

      var customFormats = {
        parsers: new rdf.Parsers({
          'application/ld+json': {parse: function () {}},
          'text/turtle': {parse: function () {}}
        })
      }

      return rdfFetch('http://example.org/formats-options', {formats: customFormats})
    })
  })
})
