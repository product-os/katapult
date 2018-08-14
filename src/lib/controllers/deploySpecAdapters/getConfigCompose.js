'use strict'
const Promise = require('bluebird')
const { readFileAsync } = Promise.promisifyAll(require('fs-extra'))
const dotenv = require('dotenv')

const getConfig = (configPath) => {
	return readFileAsync(configPath, 'utf8')
		.then(configString => {
			return dotenv.parse(Buffer.from(configString))
		})
}
module.exports = getConfig