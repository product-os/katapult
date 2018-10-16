'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const path = require('path')
const deploySpec = require('../controllers/deploySpec')
const validateEnvironmentConfiguration = require('../utils').validateEnvironmentConfiguration
const deployAdapters = require('../controllers/deployAdapters/all')
const deploySpecAdapters = require('../controllers/deploySpecAdapters/all')
const unwrap = require('keyframe').unwrap

module.exports = (args) => {
	const {
		target,
		configuration,
		environment,
		mode='defensive',
		yes=false,
		keyframe=path.join(process.cwd(), 'keyframe.yaml'),
		buildComponents,
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

			return Promise.join()
				.then( () => {
					let kf = unwrap({'logLevel': 'info'}, keyframe)
					kf = _.filter(_.get(kf,'consists_of',[]), (i) => {
						return i.type === 'sw.containerized-application'
					})
					kf = _.mapValues(_.keyBy(kf, 'slug'), 'assets')
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
