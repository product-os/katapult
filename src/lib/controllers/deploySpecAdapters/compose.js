'use strict'
const Promise = require('bluebird')
const { readFileAsync, writeFileAsync, ensureDirAsync } = Promise.promisifyAll(require('fs-extra'))
const mustache = require('mustache')
const path = require('path')
const _ = require('lodash')
const getConfig = require('./getConfigCompose')
const configValidator = require('../configValidator/configValidator')

module.exports = class generateDeploySpecFile {
	constructor(attrs, basePath, archiveStore, version, environmentName) {
		this.templatePath = path.join(basePath, attrs.template)
		this.configPath = path.join(basePath, attrs['config-store'])
		this.configManifestPath = path.join(basePath, environmentName, version, 'docker-compose', 'config-manifest.json')
		this.version = version
		this.archiveStore = archiveStore
	}

	generate() {
		return getConfig(this.configPath)
			.then(config => {
				return new configValidator(config, this.configManifestPath).validate().then((errors) => {
					if (errors.length){
						let errorList = []
						_.forEach(errors, err => {
							errorList.push(err.stack)
						})
						return errorList
					}
					else {
						return readFileAsync(this.templatePath, 'utf8')
							.then(template => {
								let output = mustache.render(template, config)
								let outputPath = path.join(
									this.archiveStore,
									this.version,
									'docker-compose',
									path.basename(this.templatePath).replace('.tpl.', '.')
								)
								return ensureDirAsync(path.dirname(outputPath))
									.then(() => {
										return writeFileAsync(outputPath, output)
									})
							})
					}
				})
					.catch(err => {
						return err.message
					})
			})
	}
}
