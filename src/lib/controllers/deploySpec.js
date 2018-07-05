'use strict'

const _ = require('lodash')
const path = require('path')
const Promise = require('bluebird')
const mustache = require('mustache')
const { readFileAsync, writeFileAsync, readdirAsync } = Promise.promisifyAll(require('fs'))
const { loadFromFile, validateDirectoryPath, validateTopLevelDirectiveYaml } = require('../utils')


module.exports = class DeploySpec {

	constructor(input, output, template, environment, verbose) {
		this.input = input
		this.output = output
		this.template = template
		this.environment = environment
		this.verbose = verbose
	}

	validate() {

		let reqDirs = [
			this.input,
			this.output,
			this.template
		]

		return Promise.map(reqDirs, dir => {
			return validateDirectoryPath(dir)
		})
			.then((errors) => {
				return validateTopLevelDirectiveYaml(this.environment, path.join(this.input, 'environments.yml'))
					.then(error => {
						return errors.concat(error)
					})
			})
			.then(errors => {
				return _.without(errors, false)
			})
	}

	generate(){
		return this.validate().then( (errors) => {

			if (errors.length) return errors

			return loadFromFile(path.join(this.input, 'environments.yml')).then( (environments) => {
				return readdirAsync(this.template).then((filenames) => {

					let promises = []
					let errors = []
					_.forEach(filenames, templateFile => {
						promises.push(
							DeploySpec.generateDeploySpecFile(
								path.join(this.template, templateFile),
								_.get(environments, this.environment),
								path.join(this.output, templateFile))
								.then( error => {
									if (error) errors.push(error)
								})
						)
					})
					return Promise.all(promises).then(() => {
						return _.without(errors, undefined)
					})
				})
			})
		})
	}

	static generateDeploySpecFile(templatePath, variables, outputPath){
		return readFileAsync(templatePath, "utf8")
			.then( template => {
				let output = mustache.render(template, variables)
				return writeFileAsync(outputPath.replace('.tpl.','.'), output)
			}).catch(err => {
				return err.message
			})
	}

}
