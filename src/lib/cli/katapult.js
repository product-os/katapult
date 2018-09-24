'use strict'

const capitano = require('capitano')

const _ = require('lodash')

const deploySpec = require('../controllers/deploySpec')

const validateEnvironmentConfiguration = require('../utils').validateEnvironmentConfiguration

const deployAdapters = require('../controllers/deployAdapters/all')

const help = () => {
	console.log('Usage: compose-merger [COMMANDS] [OPTIONS]')
	console.log('\nCommands:\n')

	for (let command of capitano.state.commands) {
		if (command.isWildcard()) continue
		console.log(`\t${command.signature}\t\t\t${command.description}`)
	}
}

capitano.globalOption({
	signature: 'verbose',
	boolean: true,
	alias: [ 'v' ],
	required: false
})

capitano.command({
	signature: 'help',
	description: 'Output help',
	action: help
})

capitano.command({
	signature: 'generate-deploy',
	description: 'Generate Deploy Spec from environment configuration.',
	options: [{
		signature: 'configuration',
		parameter: 'configuration',
		description: 'URI to deploy-template folder/repo',
		alias: [ 'c' ],
		required: true
	}, {
		signature: 'environment',
		parameter: 'environment',
		alias: [ 'e' ],
		required: true
	}, {
		signature: 'target',
		parameter: 'target',
		alias: [ 't' ],
		required: true
	}, {
		signature: 'mode',
		parameter: 'mode',
		alias: [ 'm' ]
	}, {
		signature: 'verbose',
		alias: [ 'v' ],
		boolean: true
	}],
	action: (params, options) => {
		if (options.verbose) console.info(options)

		const {
			target,
			configuration,
			environment,
			mode='defensive',
			verbose=false,
		} = options

		// Validate and process environment info
		return validateEnvironmentConfiguration(configuration, environment)
			.then(([environmentObj, error]) => {
				if (error) {
					console.error(error)
					process.exit(1)
				}
				if (target)environmentObj=_.pick(environmentObj, [target, 'archive-store', 'version'])
				return new deploySpec(
					environment,
					environmentObj,
					configuration,
					mode
				).generate()
			})
			.then(errors => {
				if (errors.length){
					_.forEach(errors, error => {
						console.error(error)
					})
					process.exit(1)
				}
			})
			.asCallback()
	}
})

capitano.command({
	signature: 'deploy',
	description: 'Deploy a Deploy Spec.',
	options: [{
		signature: 'configuration',
		parameter: 'configuration',
		description: 'URI to deploy-template folder/repo',
		alias: [ 'c' ],
		required: true
	}, {
		signature: 'environment',
		parameter: 'environment',
		alias: [ 'e' ],
		required: true
	}, {
		signature: 'mode',
		parameter: 'mode',
		alias: [ 'm' ]
	}, {
		signature: 'target',
		parameter: 'target',
		alias: [ 't' ],
		required: true
	}, {
		signature: 'verbose',
		alias: [ 'v' ],
		boolean: true
	}],
	action: (params, options) => {
		if (options.verbose) console.info(options)

		const {
			configuration,
			environment,
			mode='defensive',
			target,
			verbose=false,
		} = options

		return validateEnvironmentConfiguration(configuration, environment)
			.then(([environmentObj, error]) => {
				if (error) {
					console.error(error)
					process.exit(1)
				}
				// sync deploySpec
				return new deploySpec(
					environment,
					environmentObj,
					configuration,
					mode
				)
					.generate()
					.then(errors => {
						if (errors.length){
							_.forEach(errors, error => {
								console.error(error)
							})
							process.exit(1)
						}
					})
					.then(() => {
						if (!_.has(deployAdapters, target)){
							console.error('Target not implemented. \nAvailable options:', _.keys(deployAdapters))
							process.exit(1)
						}
						return new deployAdapters[target](environment, environmentObj).run()
					})
			})
			.asCallback()
	}
})

if (process.argv.length <= 2) {
	help()
	process.exit(1)
}

capitano.run(process.argv, (err) => {

	if (err) {
		console.error(err)
		process.exit(1)
	}
})
