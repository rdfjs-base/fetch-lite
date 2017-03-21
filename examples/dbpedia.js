const rdf = require('rdf-ext')
const rdfFetch = require('..')
const N3Parser = require('rdf-parser-n3')

let formats = {
  parsers: new rdf.Parsers({
    'text/turtle': N3Parser
  })
}

// use the Dataset API to read lat and long of the Eiffel Tower
rdfFetch('http://dbpedia.org/resource/Eiffel_Tower', {formats: formats}).then((res) => {
  return res.dataset()
}).then((dataset) => {
  let lat = dataset
    .match(null, rdf.namedNode('http://www.w3.org/2003/01/geo/wgs84_pos#lat'))
    .toArray()
    .shift()
    .object.value

  let long = dataset
    .match(null, rdf.namedNode('http://www.w3.org/2003/01/geo/wgs84_pos#long'))
    .toArray()
    .shift()
    .object.value

  console.log('The Eiffel Tower is located at lat: ' + lat + ' long: ' + long)
}).catch((err) => {
  console.error(err.stack || err.message)
})

// use the Stream API to read the opening date of the Eiffel Tower
rdfFetch('http://dbpedia.org/resource/Eiffel_Tower', {formats: formats}).then((res) => {
  return res.quadStream()
}).then((stream) => {
  let filterStream = stream.match(null, rdf.namedNode('http://dbpedia.org/ontology/openingDate'))

  filterStream.on('data', (quad) => {
    console.log('The Eiffel Tower opened on: ' + quad.object.value)
  })

  return rdf.waitFor(stream)
}).catch((err) => {
  console.error(err.stack || err.message)
})
