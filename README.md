# @rdfjs/fetch-lite

[![Build Status](https://travis-ci.org/rdfjs/fetch-lite.svg?branch=master)](https://travis-ci.org/rdfjs/fetch-lite)

[![npm version](https://img.shields.io/npm/v/@rdfjs/fetch-lite.svg)](https://www.npmjs.com/package/@rdfjs/fetch-lite)

Wrapper for fetch to simplify sending and receiving RDF data.

This is the light version of the `@rdfjs/fetch` package without the `@rdfjs/formats-common` dependency.
It can be usefully if you want to make a build for the browser with a reduced set of parsers and serializers.
The `formats` options is required for this package.
See also the `@rdfjs/fetch` documentation.

## Usage

The package exports a fetch function which wraps the request and response object for on the fly RDF quad processsing.
The function accepts the same parameters like [fetch](https://fetch.spec.whatwg.org/), but also accepts some addition options and provides additional methods.

The `options` object accepts the following additional parameters:
- `formats`: An [formats-common](https://github.com/rdfjs/formats-common) compatible object which contains a set of parsers and serializers.
  This parameter is required.
- `factory`: If given, the factory will be used to create a Dataset when `dataset()` is called.
  If the parameter is not given, the `dataset()` method will be not attached to the response.
- `fetch`: An alternative fetch implementation.
  By default [nodeify-fetch](https://github.com/bergos/nodeify-fetch) will be used.

### Request

- `headers.accept`:
- `headers.content-type`
- `body`:

### Response

- `quadStream()`:
- `dataset()`:

### Example

This example fetches data from a resource on Wikidata.
The stream API is used to process all quads.
For all `rdfs:label` quads of the defined entity, the object language and value will be written to the console.

```javascript
const formats = require('@rdfjs/formats-common')
const fetch = require('@rdfjs/fetch-lite')

const entity = 'http://www.wikidata.org/entity/Q2'
const label = 'http://www.w3.org/2000/01/rdf-schema#label'

fetch('https://www.wikidata.org/wiki/Special:EntityData/Q2.ttl', { formats }).then(res => res.quadStream()).then(quadStream => {
  return new Promise(resolve => {
    quadStream.on('end', resolve)

    quadStream.on('data', quad => {
      if (quad.subject.value === entity && quad.predicate.value === label) {
        console.log(`${quad.object.language}: ${quad.object.value}`)
      }
    })
  })
}).catch(err => console.error(err))
```
