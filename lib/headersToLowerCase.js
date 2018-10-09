function headersToLowerCase (headers) {
  const headersLowerCase = {}

  Object.entries(headers).forEach(([key, value]) => {
    headersLowerCase[key.toLowerCase()] = value
  })

  return headersLowerCase
}

module.exports = headersToLowerCase
