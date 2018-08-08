'use strict'
const { validateFilePath, validateDirectoryPath } = require('../src/lib/utils')
const templateGenerator = require('../src/lib/controllers/templateGenerator')
const deploySpec = require('../src/lib/controllers/deploySpec')
const { assertFilesEqual } = require('./testUtils')
const Promise = require('bluebird')
const { assert } = require('chai')
const mkdirAsync = Promise.promisify(require('fs').mkdir)
const execAsync = Promise.promisify(require('child_process').exec)

it('Test templateGenerator (compose)', () => {
	return mkdirAsync('/tmp/katapult-tests-tmp').then(() => {
		let verbose=false
		return (
			new templateGenerator(
				'./test/fixtures/validFileSet0',
				'composefile.yml',
				'docker-compose',
				'/tmp/katapult-tests-tmp/docker-compose.tpl.yml',
				verbose).write()
		).then(() =>{
			return assertFilesEqual(
				'/tmp/katapult-tests-tmp/docker-compose.tpl.yml',
				'./test/outputs/docker-compose/templates/t00/docker-compose.tpl.yml'
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
				'./test/fixtures/validFileSet0',
				'/tmp/katapult-test-deploySpec-tmp',
				'test/outputs/docker-compose/templates/t00',
				'balena-production',
				verbose
			).generate()
		).then(() =>{
			return assertFilesEqual(
				'/tmp/katapult-test-deploySpec-tmp/docker-compose.yml',
				'./test/outputs/docker-compose/deployspecs/ds00/docker-compose.yml'
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
				'./test/fixtures/validFileSet0',
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
				'./test/fixtures/validFileSet0',
				'/tmp/katapult-test-deploySpec-tmp',
				'test/outputs/docker-compose/templates/t00',
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
		'ENOENT: no such file or directory, stat \'test/outputs/docker-compose/deployspecs-missing\'',
		'Error parsing \'test/fixtures-missing/environments.yml\''
	]

	return (
		new deploySpec(
			'./test/fixtures-missing/',
			'/tmp/katapult-test-deploySpec-tmp-missing',
			'test/outputs/docker-compose/deployspecs-missing',
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

it('Test validateFilePath with dir', () => {
	return validateFilePath('/tmp').then(error => {
		return assert.equal(error, 'Error: /tmp is not a file')
	})
})

it('Test validateFilePath ENOENT', () => {
	return validateFilePath('/etc/cron.missing').then(error => {
		return assert.equal(error, 'ENOENT: no such file or directory, stat \'/etc/cron.missing\'')
	})
})

it('Test validateDirectoryPath ENOENT', () => {
	return validateDirectoryPath('test/fixtures/validFileSet0/targets.yml').then(error => {
		return assert.equal(error, 'Error: test/fixtures/validFileSet0/targets.yml is not a directory')
	})
})
