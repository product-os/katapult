'use strict'

const Promise = require('bluebird')
const path = require('path')
const { execAsync } = Promise.promisifyAll(require('child_process'))
const _ = require('lodash')
module.exports = class deployment {
	constructor(environmentName, environmentObj) {
		this.deploySpecBasePath = path.join(
			environmentObj['archive-store'],
			environmentName,
			environmentObj.version,
			'docker-compose'
		)
	}

	run() {
		return execAsync(`docker-compose -f ${this.deploySpecBasePath}/docker-compose.yml up -d `)
			.catch(error => {
				console.error(error.cause)
				process.exit(1)
			})
	}
}