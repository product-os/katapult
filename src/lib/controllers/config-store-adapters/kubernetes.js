'use strict'
const { config, Client } = require('kubernetes-client')
const Promise = require('bluebird')
const tunnelAsync = Promise.promisify(require('tunnel-ssh'))
const fs = require('fs')
const _ = require('lodash')
const { runInTunnel } = require('../../utils')

module.exports = class ConfigStore {
	constructor(attrs) {
		let kubeconfig = config.fromKubeconfig(_.get(attrs, attrs.kubeconfig))
		this.namespace = _.get(attrs, 'namespace')
		this.bastion = _.get(attrs, 'bastion')
		this.client = new Client({ config: kubeconfig })
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

	listSecrets() {
		return this.client.loadSpec().then(() => {
			return this.client.apis.v1.namespaces(this.namespace).secrets.get()
		})
	}

	secretExists(secretName) {
		return this.client.loadSpec().then(() => {
			return this.client.apis.v1
				.namespaces(this.namespace)
				.secrets.get()
				.then(secrets => {
					return (
						_.filter(secrets.body.items, { metadata: { name: secretName } })
							.length > 0
					)
				})
		})
	}

	deleteSecret(secretName) {
		return this.secretExists(secretName).then(exists => {
			if (exists) {
				return this.client.apis.v1
					.namespaces(this.namespace)
					.secrets(secretName)
					.delete()
			}
		})
	}

	updateSecret(k8sSecretName, name, value) {
		let manifest = {
			APIVersion: 'v1',
			Kind: 'Secret',
			metadata: {
				name: k8sSecretName
			},
			type: 'Opaque',
			data: {
				[name]: Buffer.from(value).toString('base64')
			}
		}
		return this.deleteSecret(k8sSecretName).then(() => {
			return this.client.apis.v1
				.namespaces(this.namespace)
				.secrets.post({ body: manifest })
		})
	}

	getConfig() {
		if (this.bastion) {
			return runInTunnel(this.tnlConfig, this.readConfig())
		}
		return this.readConfig()
	}

	readConfig() {
		return this.listSecrets().then(res => {
			let ret = {}
			_.forEach(res.body.items, secret => {
				if (
					_.has(
						secret.data,
						secret.metadata.name.toUpperCase().replace(/-/g, '_')
					)
				)
					_.forEach(secret.data, (value, name) => {
						if (value === null) ret[name] = ''
						else ret[name] = Buffer.from(value, 'base64').toString()
					})
			})
			return ret
		})
	}

	update(envvars) {
		if (this.bastion) {
			return runInTunnel(this.tnlConfig, this.updateEnvvars(envvars))
		}
		return this.updateEnvvars(envvars)
	}

	updateEnvvars(envvars) {
		let promises = []
		_.forEach(envvars, pair => {
			let [name, value] = pair
			let k8sSecretName = name.toLowerCase().replace(/_/g, '-')
			promises.push(this.updateSecret(k8sSecretName, name, value))
		})
		return Promise.all(promises).return(envvars)
	}
}
