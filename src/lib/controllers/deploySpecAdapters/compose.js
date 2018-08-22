'use strict'
const Promise = require('bluebird')
const { readFileAsync, writeFileAsync, ensureDirAsync } = Promise.promisifyAll(require('fs-extra'))
const mustache = require('mustache')
const path = require('path')
const _ = require('lodash')
const configStore = require('../configStoreAdapters/compose')
const configValidator = require('../configValidator/configValidator')
const configAutoGenerator = require('../configAutoGenerator/configAutoGenerator')

module.exports = class generateDeploySpecFile {
	constructor(attrs, mode, basePath, archiveStore, version, environmentName) {
		this.mode = mode
		this.templatePath = path.join(basePath, attrs.template)
		this.configPath = path.join(basePath, attrs['config-store'])
		this.configManifestPath = path.join(basePath, environmentName, version, 'docker-compose', 'config-manifest.json')
		this.version = version
		this.archiveStore = path.join(archiveStore, environmentName)
	}

	generate() {
		let cs = new configStore(this.configPath)
		return cs.getConfig()
			.then(config => {
				if (this.mode === 'aggressive'){
					let input_config = _.cloneDeep(config)
					return new configAutoGenerator(config, this.configManifestPath, this.mode).generate()
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
