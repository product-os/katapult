'use strict'
const templateGenerator = require('../src/lib/controllers/templateGenerator')
const path = require('path')
const Promise = require('bluebird')
const { assert } = require('chai')
const assertFilesEqual = require('./testUtils').assertFilesEqual
const mkdirAsync = Promise.promisify(require('fs').mkdir)
const readdirAsync = Promise.promisify(require('fs').readdir)
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


it('Test templateGenerator (kubernetes)', () => {
	return mkdirAsync('/tmp/katapult-kubernetes-tests-tmp').then(() => {
		let verbose=false
		return (
			new templateGenerator(
				'./test/fixtures/validFileSet',
				'composefile.yml',
				'kubernetes',
				'/tmp/katapult-kubernetes-tests-tmp',
				verbose).write()
		).then(() =>{
			return readdirAsync('/tmp/katapult-kubernetes-tests-tmp').then(files => {
				return Promise.map(files, fileName => {
					return assertFilesEqual(
						path.join('/tmp/katapult-kubernetes-tests-tmp', fileName),
						path.join('./test/outputs/kubernetes-templates/t00', fileName),
					)
				})
			})
		})
	}).finally(() => {
		return execAsync('rm -rf /tmp/katapult-kubernetes-tests-tmp')
	})
})
