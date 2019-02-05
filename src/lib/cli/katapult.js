'use strict'

const capitano = require('capitano')
const generateDeploy = require('../commands/generate-deploy')
let _ = require('lodash')

/**
 * Options for generate and deploy commands are the same
 * @type {*[]}
 */
const commonOptions = [
	{
		signature: 'configuration',
		parameter: 'configuration',
		description: 'URI to deploy-template folder/repo',
		alias: ['c'],
		required: false
	},
	{
		signature: 'environment',
		parameter: 'environment',
		description: 'Name of the selected environment',
		alias: ['e'],
		required: true
	},
	{
		signature: 'target',
		parameter: 'target',
		description: 'Name of the selected target',
		alias: ['t'],
		required: false
	},
	{
		signature: 'mode',
		parameter: 'mode',
		description:
			'* interactive (default): When required values are not available or valid, prompt the user for input.\n' +
			'\t\t* defensive: No action is taken when configuration validation errors occur. Fails with an informative error message.\n' +
			'\t\t* aggressive: Automatically generates missing or invalid values when configuration validation fails.',
		alias: ['m']
	},
	{
		signature: 'keyframe',
		parameter: 'keyframe',
		alias: ['k'],
		description:
			'Path to keyframe file, if available. Defaults to ./keyframe.yml',
		required: false
	},
	{
		signature: 'service-format',
		parameter: 'format',
		description:
			'Format could be either "image" (component will use a pre-built Docker image) or "build" ' +
			'(component will build the Docker image from local sources) ' +
			'Defaults to image for all components',
		alias: ['f'],
		required: false,
		type: 'array'
	},
	{
		signature: 'build-path',
		parameter: 'path',
		description:
			'Build path for a component as: --build-path <component>=<path>',
		alias: ['b'],
		required: false
	},
	{
		signature: 'verbose',
		description: 'Enable verbose mode',
		alias: ['v'],
		boolean: true
	}
]

/**
 * Generate and display help text
 */
const help = () => {
	console.log('Usage: katapult <command> [OPTIONS] <params>\n')
	console.log('Commands:\n')

	for (let command of capitano.state.commands) {
		if (!command.isWildcard()) {
			console.log(`\t${command.signature}\t\t\t${command.description}`)
			for (const option of command.options) {
				console.log(
					`\t  ${option.alias ? '-' + option.alias + ', ' : ''}--${
						option.signature
					} ${option.description ? '\n\t\t' + option.description : ''}`
				)
			}
		}
	}
}

capitano.globalOption({
	signature: 'verbose',
	boolean: true,
	alias: ['v'],
	required: false
})

capitano.command({
	signature: 'help',
	description: 'Output help',
	action: help
})

capitano.command({
	signature: 'deploy',
	description: 'Generate Deploy Spec from environment configuration and deploy',
	options: commonOptions,
	action: (params, options) => {
		options = parseOptions(options)
		if (options.verbose) {
			console.info(`input options:\n${options}`)
		}
		options['deploy'] = true
		return generateDeploy(options).asCallback()
	}
})

capitano.command({
	signature: 'generate',
	description: 'Generate Deploy Spec from environment configuration',
	options: commonOptions,
	action: (params, options) => {
		options = parseOptions(options)
		if (options.verbose) {
			console.info(`input options:\n${JSON.stringify(options, null, 2)}`)
		}
		return generateDeploy(options).asCallback()
	}
})

if (process.argv.length <= 2) {
	help()
	process.exitCode = 1
}

capitano.run(process.argv, err => {
	if (err) {
		help()
		if (process.argv.includes('-v') || process.argv.includes('--verbose')) {
			throw err
		} else {
			console.error(err.message)
		}
		process.exitCode = 1
	}
})

const parseOptions = options => {
	// Parse 'service-format' as array
	let serviceFormats = _.get(options, 'service-format')
	if (typeof serviceFormats === 'string') {
		serviceFormats = [serviceFormats]
	}
	// Parse 'build-path' as array
	let buildPaths = _.get(options, 'build-path', [])
	if (typeof buildPaths === 'string') {
		buildPaths = [buildPaths]
	}
	// Convert buildPaths to obj
	buildPaths = _.reduce(
		buildPaths.map(value => {
			return value.split('=')
		}),
		(obj, val) => {
			return _.merge(obj, { [val[0]]: val[1] })
		},
		{}
	)
	// Default configuration to deploy-templates
	let configuration = _.get(options, 'configuration')
	if (typeof configuration !== 'string') {
		options['configuration'] = 'deploy-templates'
	}
	// Combine service-format and build-path parameters into buildComponents
	let buildComponents = {}
	_.forEach(serviceFormats, value => {
		let [component, format] = value.split('=')
		if (format === 'build') {
			buildComponents[component] = _.get(buildPaths, component, null)
		}
	})

	options['buildComponents'] = buildComponents
	return options
}
