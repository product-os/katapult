const loadFromFile = require('../src/lib/utils').loadFromFile
const templateGenerator = require('../src/lib/controllers/templateGenerator')
const Promise = require('bluebird')
const assert = require('chai').assert
const { mkdirAsync } = Promise.promisifyAll(require('fs'))
const execAsync = Promise.promisify(require('child_process').exec)

it('Test templateGenerator (compose)', function(){
	return mkdirAsync('/tmp/katapult-tests-tmp').then(() => {
		let verbose=false
		return (new templateGenerator('./test/fixtures/', 'composefile.yml', 'docker-compose', '/tmp/katapult-tests-tmp/docker-compose.tpl.yml', verbose).write()).then(([release, errors]) =>{
			return assertFilesEqual('/tmp/katapult-tests-tmp/docker-compose.tpl.yml', './test/outputs/compose/docker-compose.tpl.yml')
		})
	}).finally(() => {
		return execAsync('rm -rf /tmp/katapult-tests-tmp/')
	})
});

const assertFilesEqual = (path1, path2) => {
	return loadFromFile(path1).then((obj1) => {
		return loadFromFile(path2).then(obj2 => {
			return assert.deepEqual(obj1, obj2)
		})
	})
}