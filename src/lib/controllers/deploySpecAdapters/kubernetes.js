'use strict'
const Promise = require('bluebird')
const { readFileAsync, readdirAsync, writeFileAsync, ensureDirAsync } = Promise.promisifyAll(require('fs-extra'))
const mustache = require('mustache')
const path = require('path')
const _ = require('lodash')
const configValidator = require('../configValidator/configValidator')

module.exports = class generateDeploySpecFile {

	constructor(attrs, basePath, archiveStore, version, environmentName) {
		this.templatePath = path.join(basePath, attrs.template)
		this.configPath = path.join(basePath, attrs['config-store'])
		this.configManifestPath = path.join(basePath, environmentName, version, 'kubernetes', 'config-manifest.json')
		this.namespace = attrs.namespace
		this.version = version
		this.archiveStore = archiveStore
	}

	generate () {
		let cs = new configStore(this.configPath, this.namespace)
		return cs.getConfig()
			.then((config) => {
				return new configValidator(config, this.configManifestPath).validate().then((errors) => {
					if (errors.length) {
						let errorList = []
						_.forEach(errors, err => {
							errorList.push(err.stack)
						})
						return errorList
					}
					else {
						return readdirAsync(this.templatePath)
							.then((filenames) => {
								let promises = []
								let errors = []

								_.forEach(filenames, templateFileName => {
									promises.push(
										readFileAsync(path.join(this.templatePath, templateFileName), 'utf8')
											.then(template => {
												let output = mustache.render(template, config)
												let outputPath = path.join(
													this.archiveStore,
													this.version,
													'kubernetes',
													path.basename(templateFileName).replace('.tpl.', '.')
												)
												return ensureDirAsync(path.dirname(outputPath))
													.then(() => {
														return writeFileAsync(outputPath, output)
													})
											})
									)
								})
								return Promise.all(promises).then(() => {
									return _.without(errors, undefined)
								})
							})
					}
				})
			})
			.catch(err => {
				return err.message
			})
	}
}
