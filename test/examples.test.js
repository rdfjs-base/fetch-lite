import { strictEqual } from 'assert'
import DatasetFactory from '@rdfjs/dataset/Factory.js'
import formats from '@rdfjs/formats'
import { describe, it } from 'mocha'
import rdfFetch from '../index.js'

describe('examples', () => {
  it('should load the Eiffel Tower resource from dbpedia', async () => {
    const res = await rdfFetch('http://dbpedia.org/resource/Eiffel_Tower', {
      factory: new DatasetFactory(),
      formats,
      headers: {
        accept: 'text/turtle'
      }
    })

    strictEqual(res.ok, true)

    const dataset = await res.dataset()

    strictEqual(dataset.size > 0, true)
  }).timeout(30000)
})
