'use strict'

const Promise = require('bluebird')
const path = require('path')
const fs = require('fs')
const { execAsync } = Promise.promisifyAll(require('child_process'))
const _ = require('lodash')
const tunnelAsync = Promise.promisify(require('tunnel-ssh'))
const { runInTunnel } = require('../../utils')

module.exports = class Deployment {
	constructor({ environmentName, environmentObj }) {
		this.deploySpecBasePath = path.join(
			environmentObj['archive-store'],
			environmentName,
			environmentObj.version,
			'kubernetes'
		)
		let attrs = _.get(environmentObj, 'kubernetes')
		this.kubeconfigPath = path.join(attrs.kubeconfig)
		this.bastion = _.get(attrs, 'bastion')
		this.tnlConfig = {
			username: _.get(attrs, 'bastion-username'),
			host: this.bastion,
			dstHost: _.get(attrs, 'api'),
			port: 22,
			dstPort: 443,
			privateKey: fs.readFileSync(_.get(attrs, 'bastion-key'), 'utf8'),
			localHost: '127.0.0.1',
			localPort: 8443,
			passphrase: _.get(attrs, 'bastion-key-pass')
		}
	}

	run() {
		if (this.bastion) {
			return runInTunnel(this.tnlConfig, this.deploy)
		}
		return this.deploy()
	}

	deploy() {
		return execAsync(
			`kubectl --kubeconfig=${this.kubeconfigPath} apply -f ${
				this.deploySpecBasePath
			}`
		)
	}
}
