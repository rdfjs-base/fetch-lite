/* global describe, it */

const assert = require('assert')
const headersToLowerCase = require('../lib/headersToLowerCase')

describe('headersToLowerCase', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof headersToLowerCase, 'function')
  })

  it('should convert keys to lower case', () => {
    const headers = {
      'Content-Type': 'image/jpeg',
      'accept-encoding': 'junked'
    }

    const headersLowerCase = {
      'content-type': 'image/jpeg',
      'accept-encoding': 'junked'
    }

    const actual = headersToLowerCase(headers)

    assert.deepStrictEqual(actual, headersLowerCase)
  })
})
