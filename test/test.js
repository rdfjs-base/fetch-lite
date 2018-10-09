/* global describe, it */

const assert = require('assert')
const expectError = require('./support/expectError')
const rdfFetch = require('..')

describe('@rdfjs/fetch-lite', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof rdfFetch, 'function')
  })

  it('should throw an error if now formats are given', () => {
    return expectError(() => {
      return rdfFetch('')
    })
  })
})
