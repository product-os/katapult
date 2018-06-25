'use strict';

const capitano = require('capitano')

const generator = require('../controllers/generator')
const transformer = require('../controllers/transformer')
const validator = require('../controllers/validator')

const help = () => {
	console.log(`Usage: compose-merger [COMMANDS] [OPTIONS]`)
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
	signature: 'generate',
	description: 'Generate configuration files.',
	options: [{
		signature: 'input',
		parameter: 'input',
		alias: [ 'i' ],
		required: true
	}, {
		signature: 'output',
		parameter: 'output',
		alias: [ 'o' ],
		required: false
	}, {
		signature: 'mode',
		parameter: 'mode',
		alias: [ 'm' ],
		required: true
	}, {
		signature: 'target',
		parameter: 'target',
		alias: [ 't' ],
		required: true
	}, {
		signature: 'environment',
		parameter: 'environment',
		alias: [ 'e' ],
		required: true
	}, {
		signature: 'verbose',
		alias: [ 'v' ],
		boolean: true
	}],
	action: (params, options) => {
		if (options.verbose) console.info(options)

		const {
			output='',
			input='../balena-io',
			mode,
			target,
			environment,
			verbose=false,
		} = options
		return  new validator(input, mode, target, environment, output, verbose).validate().then(errors =>{
			if(errors.length){
				for (let e in errors) {
					console.error(errors[e])
				}
				process.exit(1)
			}
			else{
				return new generator(input, mode, target, environment, output, verbose).write()
			}
		}).asCallback()

	}
})

capitano.command({
	signature: 'transform',
	description: 'Transform a docker-compose file to configuration files.',
	options: [{
		signature: 'input',
		parameter: 'input',
		alias: [ 'i' ],
		required: true
	}, {
		signature: 'output',
		parameter: 'output',
		alias: [ 'o' ],
		required: false
	}, {
		signature: 'composefile',
		parameter: 'composefile',
		alias: [ 'c' ],
		required: true
	}, {
		signature: 'target',
		parameter: 'target',
		alias: [ 't' ],
		required: true
	}, {
		signature: 'environment',
		parameter: 'environment',
		alias: [ 'e' ],
		required: true
	}, {
		signature: 'verbose',
		alias: [ 'v' ],
		boolean: true
	}],
	action: (params, options) => {
		if (options.verbose) console.info(options)

		const {
			output='',
			input='../balena-io',
			composefile,
			target,
			environment,
			verbose=false,
		} = options
		return new transformer(input, composefile, target, environment, output, verbose).write().then(([release, errors]) =>{
			if(errors.length){
				for (let e in errors) {
					console.error(errors[e])
				}
				process.exit(1)
			}
		}).asCallback()

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
