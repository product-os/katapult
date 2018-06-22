const validator = require('../src/lib/controllers/validator')

it('Test validator (stdout)', function(){
	let verbose=false
	return (new validator('test/fixtures', 'production', 'compose', 'balena-production', '', verbose).validate())
		.then(errors =>{
			return errors.length
		})
});
