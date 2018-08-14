'use strict'
const Promise = require('bluebird')
const { readFileAsync, readdirAsync, writeFileAsync, ensureDirAsync } = Promise.promisifyAll(require('fs-extra'))
const mustache = require('mustache')
const path = require('path')
const _ = require('lodash')
const getConfig = require('./getConfigKubernetes')

const generateDeploySpecFile = (templatePath, configPath, version, archiveStore) => {
	return getConfig(configPath)
		.then(config => {
			return readdirAsync(templatePath)
				.then((filenames) => {
					let promises = []
					let errors = []
					_.forEach(filenames, templateFileName => {
						promises.push(
							readFileAsync(path.join(templatePath, templateFileName), 'utf8')
								.then(template => {
									let output = mustache.render(template, config)
									let outputPath = path.join(
										archiveStore,
										version,
										'kubernetes',
										path.basename(templateFileName).replace('.tpl.','.')
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
		})
		.catch(err => {
			return err.message
		})
}

module.exports = generateDeploySpecFile
