'use strict';

const _ = require("lodash")
const Promise = require('bluebird')
const path = require('path')
const { validateFilePath, validateDirectoryPath, validateTopLevelDirectiveYaml } = require('../utils')
module.exports = class Validator {

	constructor(input, mode, target, environment, output, verbose) {
		this.errors = []
		this.verbose = verbose
		this.input = input
		this.output = output
		this.mode = mode
		this.target = target
		this.environment = environment
	}

  updateErrors(error){
		if(error.length){
			this.errors=this.errors.concat(error)
		}
	}

	validate() {
		return Validator.validateInput(this.input).then((err) => {
			this.updateErrors(err)
		})
		.then(() => {
			return Promise.join(
				Validator.validateOutput(this.output).then((err) => {
					if(this.output!=='')this.updateErrors(err)
				}),
				Validator.validateMode(this.mode, this.input).then((err) => {
					this.updateErrors(err)
				}),
				Validator.validateTarget(this.target, this.input).then((err) => {
					this.updateErrors(err)
				}),
				Validator.validateEnvironment(this.environment, this.input).then((err) => {
					this.updateErrors(err)
				}),
				() => {
					return this.errors
				}
			)
		})
	}

	static validateInput(input){
    let errors = []
		return Promise.join(
			validateDirectoryPath(input).then(error => {
				if (error)errors.push(error)
			}),
			validateFilePath(path.join(input, 'components.yml')).then(error => {
				if (error)errors.push(error)
			}),
			validateFilePath(path.join(input, 'modes.yml')).then(error => {
				if (error)errors.push(error)
			}),
			validateFilePath(path.join(input, 'targets.yml')).then(error => {
				if (error)errors.push(error)
			}),
			validateFilePath(path.join(input, 'environments.yml')).then(error => {
				if (error)errors.push(error)
			}),
			() => {
				return errors
			}
		)
	}

	static validateOutput(output){
		return validateDirectoryPath(path.dirname(output)).then(error => {
			if (error) return [error]
			else return []
		})
	}

	static validateMode(mode, input){
		return validateTopLevelDirectiveYaml(mode, path.join(input, 'modes.yml'))
	}

	static validateTarget(target, input){
		return validateTopLevelDirectiveYaml(target, path.join(input, 'targets.yml'))
	}

	static validateEnvironment(environment, input){
		return validateTopLevelDirectiveYaml(environment, path.join(input, 'environments.yml'))
	}

}
