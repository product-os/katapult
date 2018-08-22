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
			'kubernetes'
		)
		this.kubeconfigPath = environmentObj['kubernetes']['config-store']
	}

	run() {
		return execAsync(`kubectl --kubeconfig=${this.kubeconfigPath} apply -f ${this.deploySpecBasePath}`)
			.catch(error => {
				console.error(error.cause)
				process.exit(1)
			})
	}
}