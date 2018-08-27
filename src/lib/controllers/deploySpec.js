'use strict'

const _ = require('lodash')
const path = require('path')
const Promise = require('bluebird')
const mustache = require('mustache')
const { readFileAsync, writeFileAsync } = Promise.promisifyAll(require('fs'))
const deploySpecAdapters = require('./deploySpecAdapters/all')

module.exports = class DeploySpec {

	constructor(environmentName, environmentObj, basePath, mode) {
		this.mode = mode
		this.targets = _.omit(environmentObj, ['version', 'archive-store', 'pubkey', 'test-target', 'test-image'])
		this.version = environmentObj.version
		this.environmentName = environmentName
		this.basePath = basePath
		this.archiveStore = environmentObj['archive-store']
	}

	generate() {
		let promises = []
		let errors = []

		_.forEach(this.targets, (attrs, target) => {
			promises.push(
				new deploySpecAdapters[target](
					attrs,
					this.mode,
					this.basePath,
					this.archiveStore,
					this.version,
					this.environmentName,
					target
				)
					.generate()
					.then( error => {
						if (error instanceof Array){
							errors = errors.concat(error)
						}
						else if (error) errors.push(error)
					})
			)
		})
		return Promise.all(promises).then(() => {
			return _.without(errors, undefined)
		})
	}

	static generateDeploySpecFile(templatePath, variables, outputPath){
		return readFileAsync(templatePath, 'utf8')
			.then( template => {
				let output = mustache.render(template, variables)
				return writeFileAsync(outputPath.replace('.tpl.','.'), output)
			}).catch(err => {
				return err.message
			})
	}

}
