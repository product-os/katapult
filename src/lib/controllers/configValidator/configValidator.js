'use strict'
const Validator = require('jsonschema').Validator
const validationFormats = require('./validationFormats/all')
const _ = require('lodash')


module.exports = class configValidator {
	constructor(config, configManifest) {
		this.config = config
		this.configManifest = configManifest
		this.validator = new Validator()
	}

	validate() {
		return Promise.resolve()
			.then(() => {
				return configValidator.addFormatValidationRules(this.configManifest)
			})
			.then((configManifest) => {
				// adapt config value types, according to configManifest, for validation.
				_.forEach(this.config, (value, name) => {
					if (_.has(configManifest.properties, name)){
						if (configManifest.properties[name].type === 'number'){
							this.config[name] = parseInt(value)
						}
					}
				})
				return this.validator.validate(this.config, configManifest).errors
			})
	}

	static addFormatValidationRules(configManifest) {
		_.forEach(configManifest.properties, (value, name) => {
			if (_.get(value, 'format')){
				_.set(configManifest, ['properties', name, 'pattern'], validationFormats[value.format])
			}
		})
		return configManifest
	}
}
