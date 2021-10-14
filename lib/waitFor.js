import { promisify } from 'util'
import { finished } from 'readable-stream'

const waitFor = promisify(finished)

export default waitFor
