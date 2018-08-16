'use strict'
const Promise = require('bluebird')
const { readFileAsync, writeFileAsync, ensureDirAsync } = Promise.promisifyAll(require('fs-extra'))
const mustache = require('mustache')
const path = require('path')
const _ = require('lodash')
const getConfig = require('./getConfigCompose')
const configValidator = require('../configValidator/configValidator')

const generateDeploySpecFile = (templatePath, configPath, configManifestPath, version, archiveStore) => {
	return getConfig(configPath)
		.then(config => {
			return new configValidator(config, configManifestPath).validate().then((errors) => {
				if (errors){
					let errorList = []
					_.forEach(errors, err => {
						errorList.push(err.stack)
					})
					return errorList
				}
				else {
					return readFileAsync(templatePath, 'utf8')
						.then(template => {
							let output = mustache.render(template, config)
							let outputPath = path.join(
								archiveStore,
								version,
								'docker-compose',
								path.basename(templatePath).replace('.tpl.', '.')
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

module.exports = generateDeploySpecFile
