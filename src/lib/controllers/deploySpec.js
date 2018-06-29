'use strict';

const _ = require("lodash")
const Promise = require('bluebird')
const mustache = require('mustache')
const { readFileAsync, writeFileAsync, readdirAsync } = Promise.promisifyAll(require('fs'))
const path = require('path')
const { loadFromFile, ymlString } = require('../utils')
const { validateFilePath, validateDirectoryPath, validateTopLevelDirectiveYaml } = require('../utils')
const execAsync = Promise.promisify(require('child_process').exec)


module.exports = class DeploySpec {

	constructor(input, output, template, environment, verbose) {
		this.input = input
		this.output = output
		this.template = template
		this.environment = environment
		this.verbose = verbose
		this.release = null
	}

	validate() {
		let errors = []
		return Promise.join(
			validateDirectoryPath(this.input).then(error => {
				if (error) errors=errors.concat(error)
			}),
			validateDirectoryPath(path.join(this.output)).then(error => {
				if (error) errors=errors.concat(error)
			}),
			validateDirectoryPath(path.join(this.template)).then(error => {
				if (error) errors=errors.concat(error)
			}),
			() => {
				return errors
			}
		)
			.then(() => {
				return Promise.join(
					validateTopLevelDirectiveYaml(this.environment, path.join(this.input, 'environments.yml')).then(error => {
						if (error) errors=errors.concat(error)
					}),
					() => {
						return errors
					}
				)
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
							DeploySpec.generateTemplateFile(
								path.join(this.template, templateFile),
								_.get(environments, this.environment),
								path.join(this.output, templateFile))
								.then( error => {
									if (error) errors.push(error)
								})
						)
					})
					return Promise.join(promises).return(errors)
				})
			})
		})
	}

	static generateTemplateFile(templatePath, variables, outputPath){
		return readFileAsync(templatePath, "utf8").then( template => {
			return writeFileAsync(outputPath, mustache.render(template,variables))
		})
	}

}
