'use strict'

const _ = require('lodash')
const path = require('path')
const Promise = require('bluebird')
const mustache = require('mustache')
const { readFileAsync, writeFileAsync } = Promise.promisifyAll(require('fs'))
const deploySpecAdapters = require('./deploySpecAdapters/all')
module.exports = class DeploySpec {

	constructor(environmentName, environmentObj, basePath) {
		this.targets = _.omit(environmentObj, ['version', 'archive-store', 'pubkey', 'test-target', 'test-image'])
		this.version = environmentObj.version
		this.environmentName = environmentName
		this.basePath = basePath
		this.archiveStore = environmentObj['archive-store']
	}

	generate(){
		let promises = []
		let errors = []

		_.forEach(this.targets, (attrs, target) => {
			promises.push(
				deploySpecAdapters[target](
					path.join(this.basePath, attrs.template),
					path.join(this.basePath, attrs['config-store']),
					this.version,
					path.join(this.basePath, this.archiveStore, this.environmentName)
				)
					.then( error => {
						if (error) errors.push(error)
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
