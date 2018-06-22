const loadFromFile = require('../src/lib/utils').loadFromFile
const validator = require('../src/lib/controllers/validator')
const generator = require('../src/lib/controllers/generator')

it('Test validator (stdout)', function(){
	let verbose=false
	return (new validator('test/fixtures', 'production', 'compose', 'balena-production', '', verbose).validate())
		.then(errors =>{
			return errors.length
		})
});

it('Test generator (stdout)', function(){
	let verbose=false
	return (new generator('test/fixtures', 'production', 'compose', 'balena-production', '', verbose).write()).then(stdout => {
		return loadFromFile("test/outputs/test.docker-compose.out.yml").then((expected) => {
			return stdout === expected
		})
	})
});