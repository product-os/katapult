'use strict'
const Promise = require('bluebird')
const { readFileAsync } = Promise.promisifyAll(require('fs-extra'))
const dotenv = require('dotenv')

module.exports = class configStore {
	constructor(configPath) {
		this.configPath = configPath
	}

	getConfig() {
		return readFileAsync(this.configPath, 'utf8')
			.then(configString => {
				return dotenv.parse(Buffer.from(configString))
			})
	}
}
