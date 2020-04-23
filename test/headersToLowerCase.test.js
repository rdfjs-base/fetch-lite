const { deepStrictEqual, strictEqual } = require('assert')
const { describe, it } = require('mocha')
const headersToLowerCase = require('../lib/headersToLowerCase')

describe('headersToLowerCase', () => {
  it('should be a function', () => {
    strictEqual(typeof headersToLowerCase, 'function')
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

    deepStrictEqual(actual, headersLowerCase)
  })
})
