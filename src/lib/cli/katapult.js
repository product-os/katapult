'use strict'

const capitano = require('capitano')

const _ = require('lodash')

const deploySpec = require('../controllers/deploySpec')

const { validateEnvironmentConfiguration, parseEnvironmentConfiguration } = require('../utils')

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
			configuration,
			environment,
			mode='defensive',
			verbose=false,
		} = options

		// Validate and process environment info
		return validateEnvironmentConfiguration(configuration, environment)
			.then((error) => {
				if (error) {
					console.error(error)
					process.exit(1)
				}
			})
			.then(() => {
				return parseEnvironmentConfiguration(configuration, environment)
			})
			// TODO: handle git configuration locations in local clone for performance, and mutate environment.
			.then((environmentObj) => {
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
