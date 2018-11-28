'use strict'

const _ = require('lodash')
const path = require('path')
const DeploySpec = require('../controllers/deploy-spec')
const { validateEnvironmentConfiguration, unwrapKeyframe } = require('../utils')
const deployAdapters = require('../controllers/deploy-adapters')

module.exports = args => {
	const {
		target,
		configuration,
		environment,
		mode = 'interactive',
		deploy = false,
		keyframe,
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
			// keyframe paths in asc priority order. The first available is used
			let kfPaths = [
				keyframe,
				path.join(process.cwd(), 'keyframe.yml'),
				path.join(process.cwd(), 'keyframe.yaml'),
				path.join(configuration, 'keyframe.yml'),
				path.join(configuration, 'keyframe.yaml')
			]

			return unwrapKeyframe(kfPaths).then(kf => {
				return new DeploySpec({
					environmentName: environment,
					configBasePath: configuration,
					keyframe: kf,
					mode,
					buildComponents,
					environmentObj,
					verbose
				})
					.generate()
					.then(() => {
						if (deploy) {
							return new deployAdapters[target](
								environment,
								environmentObj,
								configuration
							).run()
						}
					})
			})
		})
		.then(() => {
			console.log('Done...')
		})
}
