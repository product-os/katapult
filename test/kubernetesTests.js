'use strict'
const { loadFromFile } = require('../src/lib/utils')
const templateGenerator = require('../src/lib/controllers/templateGenerator')
const deploySpec = require('../src/lib/controllers/deploySpec')
const Promise = require('bluebird')
const { assert } = require('chai')
const mkdirAsync = Promise.promisify(require('fs').mkdir)
const execAsync = Promise.promisify(require('child_process').exec)

it('Test templateGenerator for empty fileset (kubernetes)', () => {
	return mkdirAsync('/tmp/katapult-kubernetes-tests-tmp').then(() => {
		let verbose=false
		return (
			new templateGenerator(
				'./test/fixtures/invalidFileSet0',
				'composefile.yml',
				'kubernetes',
				'/tmp/katapult-kubernetes-tests-tmp',
				verbose).write()
		).then(([release, errors]) =>{
			return assert.deepEqual(
				errors,
				[ 'The release contains no components.' +
				'\nPlease check: test/fixtures/invalidFileSet0/composefile.yml' ]
			)
		})
	}).finally(() => {
		return execAsync('rm -rf /tmp/katapult-kubernetes-tests-tmp')
	})
})

