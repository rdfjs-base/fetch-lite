function expectError (p) {
  return new Promise((resolve, reject) => {
    Promise.resolve().then(() => {
      return p()
    }).then(() => {
      reject(new Error('no error thrown'))
    }).catch(() => {
      resolve()
    })
  })
}

module.exports = expectError
