'use strict'
const { loadFromFile } = require('../src/lib/utils')
const templateGenerator = require('../src/lib/controllers/templateGenerator')
const deploySpec = require('../src/lib/controllers/deploySpec')
const Promise = require('bluebird')
const { assert } = require('chai')
const mkdirAsync = Promise.promisify(require('fs').mkdir)
const execAsync = Promise.promisify(require('child_process').exec)

it('Test templateGenerator (compose)', () => {
	return mkdirAsync('/tmp/katapult-tests-tmp').then(() => {
		let verbose=false
		return (
			new templateGenerator(
				'./test/fixtures/',
				'composefile.yml',
				'docker-compose',
				'/tmp/katapult-tests-tmp/docker-compose.tpl.yml',
				verbose).write()
		).then(() =>{
			return assertFilesEqual(
				'/tmp/katapult-tests-tmp/docker-compose.tpl.yml',
				'./test/outputs/compose-templates/docker-compose.tpl.yml'
			)
		})
	}).finally(() => {
		return execAsync('rm -rf /tmp/katapult-tests-tmp/')
	})
});

it('Test deploySpec (compose)', () => {
	return mkdirAsync('/tmp/katapult-test-deploySpec-tmp').then(() => {
		let verbose=false
		return (
			new deploySpec(
				'./test/fixtures/',
				'/tmp/katapult-test-deploySpec-tmp',
				'test/outputs/compose-templates',
				'balena-production',
				verbose
			).generate()
		).then(() =>{
			return assertFilesEqual(
				'/tmp/katapult-test-deploySpec-tmp/docker-compose.yml',
				'./test/outputs/compose-deployspecs/docker-compose.yml'
			)
		})
	}).finally(() => {
		return execAsync('rm -rf /tmp/katapult-test-deploySpec-tmp/')
	})
});

it('Test deploySpec with invalid template (compose)', () => {
	return mkdirAsync('/tmp/katapult-test-deploySpec-tmp').then(() => {
		let verbose=false
		return (
			new deploySpec(
				'./test/fixtures/',
				'/tmp/katapult-test-deploySpec-tmp',
				'test/fixtures/deploySpecGenerator/',
				'balena-production',
				verbose
			).generate()
		).then((errors) =>{
			return assert.deepEqual(errors, [ 'Unclosed tag at 27' ])
		})
	}).finally(() => {
		return execAsync('rm -rf /tmp/katapult-test-deploySpec-tmp/')
	})
});

it('Test deploySpec with invalid environment (compose)', () => {
	return mkdirAsync('/tmp/katapult-test-deploySpec-tmp').then(() => {
		let verbose=false
		return (
			new deploySpec(
				'./test/fixtures/',
				'/tmp/katapult-test-deploySpec-tmp',
				'test/outputs/compose-templates',
				'balena-missing',
				verbose
			).generate()
		).then((errors) =>{
			return assert.equal(errors.length, 1)
		})
	}).finally(() => {
		return execAsync('rm -rf /tmp/katapult-test-deploySpec-tmp/')
	})
});

it('Test deploySpec validation (compose)', () => {
	let verbose=false
	let expectedErrors = [
		'ENOENT: no such file or directory, stat \'./test/fixtures-missing/\'',
		'ENOENT: no such file or directory, stat \'/tmp/katapult-test-deploySpec-tmp-missing\'',
		'ENOENT: no such file or directory, stat \'test/outputs/compose-deployspecs-missing\'',
		'Error parsing \'test/fixtures-missing/environments.yml\''
	]

	return (
		new deploySpec(
			'./test/fixtures-missing/',
			'/tmp/katapult-test-deploySpec-tmp-missing',
			'test/outputs/compose-deployspecs-missing',
			'balena-production-missing',
			verbose
		).generate()
	).then(errors =>{
		return assert.deepEqual(errors, expectedErrors)
	})
});

it('Test template interpolation function', () => {
	return deploySpec.generateDeploySpecFile(
		'test/fixtures/deploySpecGenerator/template.tpl.yml',
		{'test':'value'},
		'/tmp/katapultDeploySpecGenerator.tmp.test.yml'
	).then(error => {
		return assert.equal(error, 'Unclosed tag at 27')
	})
	.finally(() => {
		return execAsync('rm -rf /tmp/katapultDeploySpecGenerator.tmp.test.yml')
	})
})

const assertFilesEqual = (path1, path2) => {
	return loadFromFile(path1).then((obj1) => {
		return loadFromFile(path2).then(obj2 => {
			return assert.deepEqual(obj1, obj2)
		})
	})
}