'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const deploySpecAdapters = require('./deploySpecAdapters/all')

module.exports = class DeploySpec {

	constructor(environmentName, environmentObj, basePath, keyframe, mode, buildComponents) {
		this.mode = mode
		this.targets = _.omit(environmentObj, ['version', 'archive-store', 'pubkey', 'test-target', 'test-image'])
		this.version = environmentObj.version
		this.environmentName = environmentName
		this.basePath = basePath
		this.keyframe = keyframe
		this.buildComponents = buildComponents
		this.archiveStore = environmentObj['archive-store']
	}

	generate() {
		let promises = []

		_.forEach(this.targets, (attrs, target) => {
			promises.push(
				new deploySpecAdapters[target](
					attrs,
					this.mode,
					this.basePath,
					this.archiveStore,
					this.version,
					this.environmentName,
					this.keyframe,
					target,
					this.buildComponents
				)
					.generate()
			)
		})
		return Promise.all(promises)
	}
}
