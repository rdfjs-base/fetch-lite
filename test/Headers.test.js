import { strictEqual } from 'assert'
import { describe, it } from 'mocha'
import { Headers } from '../index.js'

describe('Headers', () => {
  it('should be a constructor', () => {
    strictEqual(typeof Headers, 'function')
  })

  it('should implement the Headers interface', () => {
    const headers = new Headers()

    strictEqual(typeof headers.append, 'function')
    strictEqual(typeof headers.delete, 'function')
    strictEqual(typeof headers.entries, 'function')
    strictEqual(typeof headers.get, 'function')
    strictEqual(typeof headers.has, 'function')
    strictEqual(typeof headers.set, 'function')
  })
})
