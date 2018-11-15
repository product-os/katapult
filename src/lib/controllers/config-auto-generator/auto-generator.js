'use strict'
const Promise = require('bluebird')
const _ = require('lodash')
const Validator = require('jsonschema').Validator
const {
	GENERATE_API_KEY,
	GENERATE_API_KEY_16,
	GENERATE_CA_CERT,
	GENERATE_CERT,
	GENERATE_CERT_CHAIN,
	GENERATE_CHAIN,
	GENERATE_PRIVATE_KEY,
	GENERATE_PUBLIC_KEY,
	GENERATE_DH_PARAM,
} = require('./plugins/all')
const { escape, base64decode, base64 } = require('./filter-functions')

module.exports = class ConfigAutoGenerator {
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
			if (formula) {
				let invalid =
					(_.has(this.config, name) || _.get(value, 'required')) &&
					validator.validate(
						{
							[name]: this.config[name],
						},
						{
							type: 'object',
							properties: { [name]: value },
							required: [name],
						},
					).errors.length

				if (invalid) {
					promiseChain = promiseChain
						.then(() => {
							console.log('Generating', name)
							return eval(formula.split('\n').join(''))
						})
						.then(result => {
							global[name] = result
							this.config[name] = result
						})
				}
			}
		})
		return promiseChain.return(this.config)
	}
}
