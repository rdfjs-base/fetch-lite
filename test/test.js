/* global describe, it */

const assert = require('assert')
const formats = require('rdf-formats-common')()
const nock = require('nock')
const rdf = require('rdf-ext')
const rdfFetch = require('..')
const Event = require('events').EventEmitter
const RdfSource = require('rdf-source')

function expectError (p) {
  return new Promise((resolve, reject) => {
    Promise.resolve().then(() => {
      return p()
    }).then(() => {
      reject(new Error('no error thrown'))
    }).catch(() => {
      resolve()
    })
  })
}

describe('rdf-fetch', () => {
  const simpleDataset = rdf.dataset([
    rdf.quad(
      rdf.namedNode('http://example.org/subject'),
      rdf.namedNode('http://example.org/predicate'),
      rdf.literal('object'),
      rdf.namedNode('http://example.org/graph')
    )
  ])

  const simpleGraph = rdf.graph(simpleDataset)

  const simpleGraphNT = '<http://example.org/subject> <http://example.org/predicate> "object" .\n'

  it('should be a function', () => {
    assert.equal(typeof rdfFetch, 'function')
  })

  it('should have a defaults object', () => {
    assert.equal(typeof rdfFetch.defaults, 'object')
  })

  it('should return a Promise object', () => {
    let result = rdfFetch('', {
      fetch: () => {
        return {}
      },
      formats: formats
    })

    assert.equal(typeof result, 'object')
    assert.equal(typeof result.then, 'function')
  })

  it('should throw an error if now formats are given', () => {
    return expectError(() => {
      return rdfFetch('')
    })
  })

  it('should use fetch given in options', () => {
    let touched = false

    return rdfFetch('', {
      fetch: () => {
        touched = true

        return {}
      },
      formats: formats
    }).then(() => {
      assert.equal(touched, true)
    })
  })

  it('should use fetch given in defaults', () => {
    let touched = false

    let defaultFetch = rdfFetch.defaults.fetch

    rdfFetch.defaults.fetch = () => {
      touched = true

      return {}
    }

    return rdfFetch('', {formats: formats}).then(() => {
      rdfFetch.defaults.fetch = defaultFetch

      assert.equal(touched, true)
    })
  })

  it('should build an Accept header based on formats given in options', () => {
    nock('http://example.org')
      .get('/accept-header')
      .reply(200, function () {
        assert.equal(this.req.headers.accept, 'application/ld+json, text/turtle')
      })

    let customFormats = {
      parsers: new rdf.Parsers({
        'application/ld+json': {import: () => {}},
        'text/turtle': {import: () => {}}
      })
    }

    return rdfFetch('http://example.org/accept-header', {formats: customFormats})
  })

  it('should build an Accept header based on formats given in defaults', () => {
    nock('http://example.org')
      .get('/accept-header-defaults')
      .reply(200, function () {
        assert.equal(this.req.headers.accept, 'application/ld+json, text/turtle')
      })

    let customFormats = {
      parsers: new rdf.Parsers({
        'application/ld+json': {import: () => {}},
        'text/turtle': {import: () => {}}
      })
    }

    rdfFetch.defaults.formats = customFormats

    return rdfFetch('http://example.org/accept-header-defaults').then(() => {
      rdfFetch.defaults.formats = null
    })
  })

  it('should not touch the body if it is a String', () => {
    nock('http://example.org')
      .post('/body-string')
      .reply(function (url, body) {
        assert.equal(this.req.headers['content-type'], 'application/n-triples')
        assert.equal(body, 'test')

        return [200, '', {'Content-Type': 'application/n-triples'}]
      })

    return rdfFetch('http://example.org/body-string', {
      method: 'post',
      headers: {'Content-Type': 'application/n-triples'},
      body: 'test',
      formats: formats
    })
  })

  it('should use the content type given in options to serialize the body', () => {
    nock('http://example.org')
      .post('/body-content-type')
      .reply(function (url, body) {
        assert.equal(this.req.headers['content-type'], 'application/n-triples')
        assert.equal(body, simpleGraphNT)

        return [200, '', {'Content-Type': 'application/n-triples'}]
      })

    return rdfFetch('http://example.org/body-content-type', {
      method: 'post',
      headers: {'Content-Type': 'application/n-triples'},
      body: simpleGraph.toStream(),
      formats: formats
    })
  })

  it('should use the content type given in defaults to serialize the body', () => {
    nock('http://example.org')
      .post('/body-content-type-defaults')
      .reply(function (url, body) {
        assert.equal(this.req.headers['content-type'], 'application/n-triples')
        assert.equal(body, '<http://example.org/subject> <http://example.org/predicate> "object" .\n')

        return [200, '', {'Content-Type': 'application/n-triples'}]
      })

    rdfFetch.defaults.contentType = 'application/n-triples'

    return rdfFetch('http://example.org/body-content-type-defaults', {
      method: 'post',
      body: simpleGraph.toStream(),
      formats: formats
    }).then(() => {
      rdfFetch.defaults.contentType = null
    })
  })

  it('should use the content type of the first serializer found to serialize the body if no content type was defined', () => {
    nock('http://example.org')
      .post('/body-content-type-formats')
      .reply(function (url, body) {
        assert.equal(this.req.headers['content-type'], 'application/ld+json')
        assert.equal(body, '[{"@id":"@default","@graph":{"@id":"http://example.org/subject","http://example.org/predicate":"object"}}]')

        return [200, '', {'Content-Type': 'application/n-triples'}]
      })

    return rdfFetch('http://example.org/body-content-type-formats', {
      method: 'post',
      body: simpleGraph.toStream(),
      formats: formats
    })
  })

  it('should not attach the graph object if there is no content (status code 204)', () => {
    nock('http://example.org')
      .get('/response-content-type')
      .reply(() => {
        return [204, '']
      })

    rdfFetch('http://example.org/response-content-type', {formats: formats}).then((res) => {
      assert.equal(res.graph, null)
    })
  })

  it('should use the Content-Type header field to find the parsers to parse the response', () => {
    nock('http://example.org')
      .get('/response-content-type')
      .reply(() => {
        return [200, '', {'Content-Type': 'application/n-triples'}]
      })

    let customFormats = {
      parsers: {
        list: () => {
          return []
        },
        import: (mediaType, stream) => {
          assert.equal(mediaType, 'application/n-triples')

          let quadStream = new Event()

          stream.on('end', () => {
            quadStream.emit('end')
          })

          stream.resume()

          return quadStream
        }
      }
    }

    return rdfFetch('http://example.org/response-content-type', {formats: customFormats}).then((res) => {
      return res.dataset()
    })
  })

  it('should use the defaultContentType option to find the parsers to parse the response', () => {
    nock('http://example.org')
      .get('/response-content-type-option')
      .reply(() => {
        return [200, '']
      })

    let customFormats = {
      parsers: {
        list: () => {
          return []
        },
        import: (mediaType, stream) => {
          assert.equal(mediaType, 'application/n-triples')

          let quadStream = new Event()

          stream.on('end', () => {
            quadStream.emit('end')
          })

          stream.resume()

          return quadStream
        }
      }
    }

    return rdfFetch('http://example.org/response-content-type-option', {
      formats: customFormats,
      defaultContentType: 'application/n-triples'
    }).then((res) => {
      return res.dataset()
    })
  })

  it('should use the defaultContentType defaults to find the parsers to parse the response', () => {
    nock('http://example.org')
      .get('/response-content-type-defaults')
      .reply(() => {
        return [200, '']
      })

    let customFormats = {
      parsers: {
        list: () => {
          return []
        },
        import: (mediaType, stream) => {
          assert.equal(mediaType, 'application/n-triples')

          let quadStream = new Event()

          stream.on('end', () => {
            quadStream.emit('end')
          })

          stream.resume()

          return quadStream
        }
      }
    }

    rdfFetch.defaults.defaultContentType = 'application/n-triples'

    rdfFetch('http://example.org/response-content-type-defaults', {formats: customFormats}).then((res) => {
      return res.dataset()
    }).then(() => {
      rdfFetch.defaults.defaultContentType = null
    })
  })

  it('should call the parser with all required parameters to parse the response', () => {
    nock('http://example.org')
      .get('/parser-parameters')
      .reply(() => {
        return [200, 'content', {'Content-Type': 'application/n-triples'}]
      })

    let customFormats = {
      parsers: {
        list: () => {
          return []
        },
        import: (mediaType, stream, options) => {
          assert.deepEqual(options, {
            baseIRI: 'http://example.org/parser-parameters'
          })

          let quadStream = new Event()

          let content = ''

          stream.on('data', (chunk) => {
            content += chunk
          })

          stream.on('end', () => {
            assert.equal(content, 'content')

            quadStream.emit('end')
          })

          return quadStream
        }
      }
    }

    return rdfFetch('http://example.org/parser-parameters', {
      formats: customFormats
    }).then((res) => {
      return res.dataset()
    })
  })

  it('should attach a method to get the parsed dataset from the response', () => {
    nock('http://example.org')
      .get('/dataset')
      .reply(() => {
        return [200, 'content', {'Content-Type': 'application/n-triples'}]
      })

    let customFormats = {
      parsers: {
        list: () => {
          return []
        },
        import: () => {
          let stream = new RdfSource()

          stream.push(rdf.quad(
            rdf.namedNode('http://example.org/subject'),
            rdf.namedNode('http://example.org/predicate'),
            rdf.literal('object'),
            rdf.namedNode('http://example.org/graph')
          ))

          stream.push(null)

          return stream
        }
      }
    }

    return rdfFetch('http://example.org/dataset', {formats: customFormats}).then((res) => {
      return res.dataset()
    }).then((dataset) => {
      assert(simpleDataset.equals(dataset))
    })
  })
})
