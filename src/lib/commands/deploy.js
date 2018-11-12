'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const path = require('path')
const deploySpec = require('../controllers/deploySpec')
const { validateEnvironmentConfiguration } = require('../utils')
const deployAdapters = require('../controllers/deployAdapters/all')
const deploySpecAdapters = require('../controllers/deploySpecAdapters/all')
const { loadFromJSONFileOrNull } = require('../utils')

module.exports = (args) => {
	const {
		target,
		configuration,
		environment,
		mode='defensive',
		yes=false,
		keyframe=path.join(process.cwd(), 'keyframe.json'),
		buildComponents,
		verbose=false
	} = args

	// Validate and process environment info
	return validateEnvironmentConfiguration(configuration, environment)
		.then((environmentObj) => {

			if (target){
				if (!_.has(deploySpecAdapters, target)){
					throw 'Target not implemented. \nAvailable options: ' + String(_.keys(deployAdapters))
				}
				environmentObj = _.pick(environmentObj, [target, 'archive-store', 'version'])
			}

			return Promise.join(loadFromJSONFileOrNull(keyframe))
				.then(([kf]) => {
					return new deploySpec(
						environment,
						environmentObj,
						configuration,
						kf,
						mode,
						buildComponents
					)
						.generate()
						.then(yes ? () => {
							return new deployAdapters[target](environment, environmentObj).run()
						} : Promise.resolve())
				})
		}).catch(error => {
			console.error(error.message)
			process.exit(1)
		})
		.then(()=> {
			console.log('Done...')
		})
}
