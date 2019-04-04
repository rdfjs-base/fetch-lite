const { finished } = require('readable-stream')
const { promisify } = require('util')

module.exports = promisify(finished)
