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
		let promiseChain = Promise.resolve()
		_.forEach(configManifest.properties, (value, name) => {
			let formula = _.get(value, '$$formula')
			if (formula){
				let invalid =
					(_.has(this.config, name) || configManifest.required.includes(name)) &&
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
					let generator = _.split(formula, '(', 1).map(_.trim)[0]
					let formulaArgs = formula.substring(
						formula.indexOf('('),
						formula.lastIndexOf(')') + 1
					)
					if (formulaArgs && formulaArgs.length > 2) {
						let properties = this.config
						promiseChain = promiseChain.then(()=>{
							return Promise.resolve(autoGenerators[generator](eval(formulaArgs))).then(output => {
								if(Array.isArray(output)){
									this.config[name] = output[0]
									// todo: add ref_config validation in config-manifest; Validate output length.
									_.forEach(_.zip(eval(formulaArgs).ref_config, _.drop(output)), ([name, value]) =>{
										this.config[name] = value
									})
								}
								else{
									this.config[name] = output
								}
								return this.config
							})
						})
					}
					else {
						this.config[name] = autoGenerators[generator]()
					}
				}
			}
		})
		return promiseChain
	}
}
