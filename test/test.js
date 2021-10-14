import { rejects, strictEqual } from 'assert'
import { describe, it } from 'mocha'
import rdfFetch from '../index.js'

describe('@rdfjs/fetch-lite', () => {
  it('should be a function', () => {
    strictEqual(typeof rdfFetch, 'function')
  })

  it('should throw an error if now formats are given', () => {
    return rejects(async () => {
      await rdfFetch('')
    })
  })
})
