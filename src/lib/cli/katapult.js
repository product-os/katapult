'use strict'

const capitano = require('capitano')

const deploy = require('../commands/deploy')

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
	signature: 'deploy',
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
		required: false
	}, {
		signature: 'mode',
		parameter: 'mode',
		alias: [ 'm' ]
	}, {
		signature: 'keyframe',
		parameter: 'keyframe',
		alias: [ 'k' ],
		required: false
	}, {
		signature: 'verbose',
		alias: [ 'v' ],
		boolean: true
	}, {
		signature: 'yes',
		description: 'Deploy to deploy adapter',
		alias: [ 'y' ],
		boolean: true
	}],
	action: (params, options) => {
		if (options.verbose) console.info(options)
		return deploy(options).asCallback()
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
