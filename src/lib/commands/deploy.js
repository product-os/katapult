'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const deploySpec = require('../controllers/deploySpec')
const validateEnvironmentConfiguration = require('../utils').validateEnvironmentConfiguration
const deployAdapters = require('../controllers/deployAdapters/all')
const deploySpecAdapters = require('../controllers/deploySpecAdapters/all')
const loadFromJSONFileOrNull = require('../utils').loadFromJSONFileOrNull

module.exports = (args) => {
	const {
		target,
		configuration,
		environment,
		mode='defensive',
		yes=false,
		keyframe,
		verbose=false
	} = args

	// Validate and process environment info
	return validateEnvironmentConfiguration(configuration, environment)
		.then(([environmentObj, error]) => {
			if (error) {
				console.error(error)
				process.exit(1)
			}

			if (target){
				if (!_.has(deploySpecAdapters, target)){
					console.error('Target not implemented. \nAvailable options:', _.keys(deployAdapters))
					process.exit(1)
				}
				environmentObj=_.pick(environmentObj, [target, 'archive-store', 'version'])
			}

			return Promise.join(loadFromJSONFileOrNull(keyframe))
				.then(([kf]) => {
					return new deploySpec(
						environment,
						environmentObj,
						configuration,
						kf,
						mode
					)
						.generate()
						.then(yes ? () => {
							if (!_.has(deployAdapters, target)){
								console.error('Target not implemented. \nAvailable options:', _.keys(deployAdapters))
								process.exit(1)
							}
							return new deployAdapters[target](environment, environmentObj).run()
						} : Promise.resolve())
				})
		})
		.then(errors => {
			if (errors.length){
				_.forEach(errors, error => {
					console.error(error)
				})
				process.exit(1)
			}
			else{
				console.log('Done')
			}
		})
}
