'use strict'
const Promise = require('bluebird')
const { readFileAsync, writeFileAsync, ensureDirAsync } = Promise.promisifyAll(require('fs-extra'))
const mustache = require('mustache')
const path = require('path')
const _ = require('lodash')
const configStore = require('../configStoreAdapters/all')['compose']
const configValidator = require('../configValidator/configValidator')
const configAutoGenerator = require('../configAutoGenerator/configAutoGenerator')
const configManifest = require('../configManifest/configManifest')
const { ensureRepoInPath } = require('../../utils')

module.exports = class generateDeploySpecFile {
	constructor(attrs, mode, basePath, archiveStore, version, environmentName, keyframe, target, buildComponents) {
		this.mode = mode
		this.target = target
		this.templatePath = path.join(basePath, attrs.template)
		this.configPath = path.join(basePath, attrs['config-store'])
		this.buildComponents = buildComponents || _.get(attrs, 'build-components', [])
		this.configManifestPath = path.join(basePath, environmentName, version, target, 'config-manifest.yml')
		this.version = version
		this.keyframe = keyframe
		this.archiveStore = path.join(archiveStore, environmentName)
	}

	generate() {
		let cs = new configStore(this.configPath)
		let cm = new configManifest(this.configManifestPath)
		return Promise.join(cs.getConfig(), cm.getConfigManifest())
			.tap(([config, cManifest]) => {
				if (this.mode === 'aggressive'){
					let input_config = _.cloneDeep(config)
					return new configAutoGenerator(config, cManifest, this.mode).generate()
						.then(config => {
							return cs.update(
								_.differenceWith(
									_.toPairs(config),
									_.toPairs(input_config),
									_.isEqual)
							)
						})
				}
			})
			.then(([config, cManifest]) => {
				return new configValidator(config, cManifest).validate().then((errors) => {
					if (errors.length){
						let errorString = ''
						_.forEach(errors, err => {
							errorString += err.stack + '\n'
						})
						throw new Error(errorString)
					}
					else {
						return readFileAsync(this.templatePath, 'utf8')
							.then(template => {
								if (this.keyframe && _.get(this.keyframe, 'components') ){
									_.forEach(this.keyframe['components'], (value, name) =>{
										config[name+'-image'] = _.get(value, 'image')
									})
								}
								let promises = Promise.resolve()
								_.forEach(this.buildComponents, (buildPath, name) =>{
									buildPath = buildPath || path.join(process.cwd(), name)
									config['build-' + name] = true
									config[name + '-build-path'] = buildPath
									promises = promises.then(()=>{
										if (!_.get(this.keyframe['components'], name)){
											throw new Error('Build component: ' + name + ' not defined in keyframe')
										}
										if (!_.get(this.keyframe['components'], [name, 'repo'], '')) {
											throw new Error('Build component: ' + name + ' repo not defined in keyframe')
										}
										return ensureRepoInPath(_.get(this.keyframe['components'][name], 'repo', ''), buildPath)
									})
								})
								return promises.then(()=>{
									let output = mustache.render(template, config)
									let outputPath = path.join(
										this.archiveStore,
										this.version,
										this.target,
										path.basename(this.templatePath).replace('.tpl.', '.')
									)
									return ensureDirAsync(path.dirname(outputPath))
										.then(() => {
											return writeFileAsync(outputPath, output)
										})
								})
							})
					}
				})
			})
	}
}
