'use strict'
const Validator = require('jsonschema').Validator
const validationFormats = require('./validation-formats/all')
const _ = require('lodash')

module.exports = class ConfigValidator {
	constructor(config, configManifest) {
		this.config = config
		this.configManifest = configManifest
		this.validator = new Validator()
	}

	validate() {
		return Promise.resolve(this.configManifest)
			.then(ConfigValidator.addFormatValidationRules)
			.then(() => {
				// adapt config value types, according to config-manifest, for validation.
				_.forEach(this.config, (value, name) => {
					if (_.has(this.configManifest.properties, name)) {
						if (this.configManifest.properties[name].type === 'number') {
							this.config[name] = parseInt(value)
						}
					}
				})
				return this.validator.validate(this.config, this.configManifest).errors
			})
	}

	static addFormatValidationRules(configManifest) {
		_.forEach(configManifest.properties, (value, name) => {
			if (_.get(value, 'format')) {
				_.set(
					configManifest,
					['properties', name, 'pattern'],
					validationFormats[value.format],
				)
			}
		})
		return configManifest
	}
}
