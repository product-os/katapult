'use strict'
const Promise = require('bluebird')
const { readFileAsync } = Promise.promisifyAll(require('fs-extra'))

module.exports = class configManifest {
	constructor(configManifestPath) {
		this.configManifestPath = configManifestPath
	}

	getConfigManifest() {
		return readFileAsync(this.configManifestPath, 'utf8')
			.then(JSON.parse)
	}
}
