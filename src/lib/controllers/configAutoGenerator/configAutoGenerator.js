'use strict'
const Promise = require('bluebird')
const _ = require('lodash')
const Validator = require('jsonschema').Validator
const {
	GENERATE_API_KEY,
	GENERATE_API_KEY_16,
	GENERATE_CA,
	GENERATE_CERT,
	GENERATE_CERT_CHAIN,
	GENERATE_CHAIN
} = require('./autoGeneratorPlugins/all')


module.exports = class configAutoGenerator {
	constructor(config, configManifest) {
		this.config = config
		this.configManifest = configManifest
	}

	generate() {
		Object.assign(global, this.config)
		let validator = new Validator()
		let promiseChain = Promise.resolve()
		_.forEach(this.configManifest.properties, (value, name) => {
			let formula = _.get(value, ['default', 'eval'])
			if (formula){
				let invalid =
					(_.has(this.config, name) || this.configManifest.required.includes(name)) &&
					validator.validate(
						{
							[name]: this.config[name]
						},
						{
							'type': 'object',
							'properties': {[name]: value},
							'required': [name]
						}).errors.length

				if (invalid){
					return Promise.resolve(eval(formula))
						.then(result => {this.config[name] = result})
				}
			}
		})
		return promiseChain
	}
}
