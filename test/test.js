const { rejects, strictEqual } = require('assert')
const { describe, it } = require('mocha')
const rdfFetch = require('..')

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
