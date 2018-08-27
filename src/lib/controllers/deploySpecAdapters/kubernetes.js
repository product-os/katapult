'use strict'
const Promise = require('bluebird')
const { readFileAsync, readdirAsync, writeFileAsync, ensureDirAsync } = Promise.promisifyAll(require('fs-extra'))
const mustache = require('mustache')
const path = require('path')
const _ = require('lodash')
const configStore = require('../configStoreAdapters/all')['kubernetes']
const configValidator = require('../configValidator/configValidator')
const configAutoGenerator = require('../configAutoGenerator/configAutoGenerator')

module.exports = class generateDeploySpecFile {

	constructor(attrs, mode, basePath, archiveStore, version, environmentName) {
		this.mode = mode
		this.templatePath = path.join(basePath, attrs.template)
		this.configPath = path.join(basePath, attrs['config-store'])
		this.configManifestPath = path.join(basePath, environmentName, version, 'kubernetes', 'config-manifest.json')
		this.namespace = attrs.namespace
		this.version = version
		this.archiveStore = path.join(archiveStore, environmentName)
	}

	generate () {
		let cs = new configStore(this.configPath, this.namespace)
		return cs.getConfig()
			.then(config => {
				if (this.mode === 'aggressive'){
					let input_config = _.cloneDeep(config)
					return new configAutoGenerator(config, this.configManifestPath).generate()
						.then(config => {
							return cs.update(
								_.differenceWith(
									_.toPairs(config),
									_.toPairs(input_config),
									_.isEqual)
							)
						})
						.then(()=> {
							return config
						})
				}
				return config
			})
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
