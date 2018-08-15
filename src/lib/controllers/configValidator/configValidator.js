'use strict'
const { loadFromJSONFile } = require('../../utils')
const Validator = require('jsonschema').Validator
const validationFormats = require('./validationFormats/all')
const _ = require('lodash')


module.exports = class configValidator {
	constructor(config, configManifestPath) {
		this.config = config
		this.configManifestPath = configManifestPath
		this.validator = new Validator()
	}

	validate() {
		return loadFromJSONFile(this.configManifestPath)
			.then((configManifest) => {
				return configValidator.addFormatValidationRules(configManifest)
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
				// console.log(this.config)
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
