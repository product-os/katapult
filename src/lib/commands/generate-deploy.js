'use strict'

const _ = require('lodash')
const path = require('path')
const DeploySpec = require('../controllers/deploy-spec')
const { validateEnvironmentConfiguration } = require('../utils')
const deployAdapters = require('../controllers/deploy-adapters')
const { loadFromJSONFileOrNull } = require('../utils')

module.exports = args => {
	const {
		target,
		configuration,
		environment,
		mode = 'interactive',
		deploy = false,
		keyframe = path.join(process.cwd(), 'keyframe.json'),
		buildComponents,
		verbose = false
	} = args

	// Validate and process environment info
	return validateEnvironmentConfiguration(configuration, environment)
		.then(environmentObj => {
			if (target) {
				if (!_.has(deployAdapters, target)) {
					throw new Error(
						'Target not implemented. \nAvailable options: ' +
							String(_.keys(deployAdapters))
					)
				}
				environmentObj = _.pick(environmentObj, [
					target,
					'archive-store',
					'version'
				])
			}

			return loadFromJSONFileOrNull(keyframe).then(kf => {
				return new DeploySpec({
					environmentName: environment,
					configBasePath: configuration,
					keyframe: kf,
					mode,
					buildComponents,
					environmentObj
				})
					.generate()
					.then(() => {
						if (deploy) {
							return new deployAdapters[target](
								environment,
								environmentObj
							).run()
						}
					})
			})
		})
		.then(() => {
			console.log('Done...')
		})
}
