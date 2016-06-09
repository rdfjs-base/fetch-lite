var rdfFetch = require('..')

rdfFetch('http://dbpedia.org/resource/Eiffel_Tower').then(function (res) {
  console.log(res.graph.toString())
}).catch(function (err) {
  console.error(err.stack || err.message)
})
