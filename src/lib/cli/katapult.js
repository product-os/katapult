'use strict';

const capitano = require('capitano')

const templateGenerator = require('../controllers/templateGenerator')
const deploySpec = require('../controllers/deploySpec')

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
	description: 'Generate Deploy Spec from template path and environment configuration.',
	options: [{
		signature: 'input',
		parameter: 'input',
		alias: [ 'i' ],
		required: true
	}, {
		signature: 'output',
		parameter: 'output',
		alias: [ 'o' ],
		required: true
	}, {
		signature: 'template',
		parameter: 'template',
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
			output,
			input='../balena-io',
			template,
			environment,
			verbose=false,
		} = options
		return new deploySpec(input, output, template, environment, verbose).generate().then(errors => {
			if(errors.length){
				for (let e in errors) {
					console.error(errors[e])
				}
				process.exit(1)
			}
		}).asCallback()
	}
})

capitano.command({
	signature: 'template',
	description: 'Generate target specific template files.',
	options: [{
		signature: 'input',
		parameter: 'input',
		alias: [ 'i' ],
		required: true
	}, {
		signature: 'output',
		parameter: 'output',
		alias: [ 'o' ],
		required: true
	}, {
		signature: 'composefile',
		parameter: 'composefile',
		alias: [ 'c' ],
		required: false
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
			output,
			input,
			composefile='composefile.yml',
			target,
			verbose=false,
		} = options
		return new templateGenerator(input, composefile, target, output, verbose).write().then(([release, errors]) =>{
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
