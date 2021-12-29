import fetch, { Headers } from './index.js'

function createFetch (context) {
  const result = function (url, options = {}) {
    const factory = typeof context.dataset === 'function' ? context : null

    return fetch(url, {
      ...options,
      factory,
      fetch: context._fetch.fetch,
      formats: context.formats
    })
  }

  result.config = function (key, value) {
    context._fetch[key] = value
  }

  result.Headers = Headers

  return result
}

class FetchFactory {
  init () {
    this._fetch = {
      fetch: null
    }

    this.fetch = createFetch(this)
  }

  clone (original) {
    for (const [key, value] of Object.entries(original._fetch)) {
      this._fetch[key] = value
    }
  }
}

export default FetchFactory
