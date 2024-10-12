import DataModelFactory from '@rdfjs/data-model/Factory.js'
import DatasetFactory from '@rdfjs/dataset/Factory.js'
import Environment from '@rdfjs/environment'

const rdf = new Environment([DataModelFactory, DatasetFactory])

const example = {}

example.subject = rdf.namedNode('http://example.org/subject')
example.subjectNt = `<${example.subject.value}>`
example.predicate = rdf.namedNode('http://example.org/predicate')
example.predicateNt = `<${example.predicate.value}>`
example.object = rdf.literal('object')
example.objectNt = `"${example.object.value}"`
example.quad = rdf.quad(example.subject, example.predicate, example.object)
example.quadNt = '<http://example.org/subject> <http://example.org/predicate> "object" .\n'
example.quadTtl = '@prefix ex: <http://example.org/>.\n\nex:subject\n  ex:predicate "object".\n'
example.dataset = rdf.dataset([example.quad])

export default example
