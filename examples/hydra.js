var rdf = require('rdf-ext')
var rdfFetch = require('..')

var subject = rdf.createBlankNode()

var graph = rdf.createGraph([
  rdf.createTriple(
    subject,
    rdf.createNamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
    rdf.createNamedNode('http://www.markus-lanthaler.com/hydra/api-demo/vocab#User')
  ),
  rdf.createTriple(
    subject,
    rdf.createNamedNode('http://www.markus-lanthaler.com/hydra/api-demo/vocab#User/name'),
    rdf.createLiteral('test name')
  ),
  rdf.createTriple(
    subject,
    rdf.createNamedNode('http://www.markus-lanthaler.com/hydra/api-demo/vocab#User/email'),
    rdf.createLiteral('test@test.com')
  ),
  rdf.createTriple(
    subject,
    rdf.createNamedNode('http://www.markus-lanthaler.com/hydra/api-demo/vocab#User/password'),
    rdf.createLiteral('testpassword')
  )
])

rdfFetch('http://www.markus-lanthaler.com/hydra/api-demo/users/', {
  method: 'post',
  headers: {'Content-Type': 'application/ld+json', 'Accept': 'application/ld+json'},
  body: graph
}).then(function (res) {
  console.log(res.status)
  console.log(res.graph.toString())
}).catch(function (err) {
  console.error(err.stack || err.message)
})
