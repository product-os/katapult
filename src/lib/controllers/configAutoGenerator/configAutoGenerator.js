'use strict'
const Promise = require('bluebird')
const { loadFromJSONFile } = require('../../utils')
const _ = require('lodash')
const autoGenerators = require('./autoGeneratorPlugins/all')
const Validator = require('jsonschema').Validator

module.exports = class configAutoGenerator {
	constructor(config, configManifestPath) {
		this.config = config
		this.configManifestPath = configManifestPath
	}

	generate() {
		return loadFromJSONFile(this.configManifestPath)
			.then((configManifest) => {
				return this.applyGenerationRules(configManifest)
			})
	}

	applyGenerationRules(configManifest) {
		let validator = new Validator()
		_.forEach(configManifest.properties, (value, name) => {
			let formula = _.get(value, '$$formula')
			if (formula){
				let invalid = _.has(this.config, name) &&
					validator.validate(
						{
							[name]: this.config[name]
						},
						{
							'type': 'object',
							'properties': {[name]: value}
						}).errors.length

				if (invalid){
					let generator = _.split(formula, '(', 1).map(_.trim)[0]
					let formulaArgs = formula.substring(
						formula.indexOf('('),
						formula.lastIndexOf(')') + 1
					)
					if (formulaArgs && formulaArgs.length > 2) {
						this.config[name] = autoGenerators[generator](eval(formulaArgs))
					}
					else {
						this.config[name] = autoGenerators[generator]()
					}
				}
			}
		})
		return this.config
	}
}
