'use strict'
const Promise = require('bluebird')
const _ = require('lodash')
const Validator = require('jsonschema').Validator
const inquirer = require('inquirer')
const ConfigValidator = require('../config-validator')

const {
	GENERATE_API_KEY,
	GENERATE_API_KEY_16,
	GENERATE_CA_CERT,
	GENERATE_CERT,
	GENERATE_CERT_CHAIN,
	GENERATE_CHAIN,
	GENERATE_EC_PRIVATE_KEYPAIR,
	GENERATE_EC_CERT,
	GENERATE_PRIVATE_KEY,
	GENERATE_PUBLIC_KEY,
	GENERATE_DH_PARAM,
	GENERATE_RSA_TOKENAUTH_KEYID
} = require('./plugins/all')
const { escape, base64decode, base64 } = require('./filter-functions')

module.exports = class ConfigGenerator {
	constructor({ config, configManifest, mode }) {
		this.config = config
		this.configManifest = configManifest
		this.mode = mode
	}

	/**
	 * Validates property against this.configManifest
	 * @param name: Property name
	 * @param value: Property value
	 * @returns: {boolean true|error string}
	 */
	validateProperty(name, value) {
		let validator = new Validator()
		let schemaErrors = validator.validate(
			{
				[name]: value
			},
			{
				type: 'object',
				properties: {
					[name]: _.get(this.configManifest.properties, name)
				},
				required: [name]
			}
		)
		if (schemaErrors.valid) {
			return true
		}
		return schemaErrors.errors[0].stack
	}

	generate() {
		Object.assign(global, this.config)

		return new ConfigValidator(this.config, this.configManifest)
			.validate(false)
			.then(errors => {
				let invalidProperties = _.reduce(
					errors,
					(result, o) => {
						result[_.replace(o.property, /^instance\./g, '')] = o
						return result
					},
					{}
				)
				if (this.mode === 'aggressive') {
					return this.generateAgressively(invalidProperties)
				} else if (this.mode === 'interactive') {
					return this.generateInteractively(invalidProperties)
				}
				return this.config
			})
	}

	generateAgressively(invalidProperties) {
		let promiseChain = Promise.resolve()
		_.forEach(invalidProperties, (error, propertyName) => {
			promiseChain = promiseChain
				.then(() => {
					let formula = _.get(this.configManifest, [
						'properties',
						propertyName,
						'default',
						'eval'
					])
					if (formula) {
						console.log('Generating', propertyName)
						return eval(formula.split('\n').join(''))
					} else {
						throw new Error(error.stack)
					}
				})
				.then(result => {
					global[propertyName] = result
					this.config[propertyName] = result
				})
		})
		return promiseChain.then(() => {
			return this.config
		})
	}

	generateInteractively(invalidProperties) {
		let questions = []
		_.forEach(invalidProperties, (error, propertyName) => {
			questions.push({
				message: error.stack,
				type: 'input',
				name: propertyName,
				validate: value => {
					return this.validateProperty(propertyName, value)
				}
			})
		})
		return inquirer.prompt(questions).then(values => {
			_.forEach(values, (value, name) => {
				global[name] = value
				this.config[name] = value
			})
			return this.config
		})
	}
}
