'use strict'
const { config, Client } = require('kubernetes-client')
const Promise = require('bluebird')
const _ = require('lodash')

module.exports = class ConfigStore {
	constructor(kubeconfigPath, namespace) {
		let cfg = config.fromKubeconfig(kubeconfigPath)
		this.namespace = namespace
		this.client = new Client({ config: cfg })
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
				name: k8sSecretName,
			},
			type: 'Opaque',
			data: {
				[name]: Buffer.from(value).toString('base64'),
			},
		}
		return this.deleteSecret(k8sSecretName).then(() => {
			return this.client.apis.v1
				.namespaces(this.namespace)
				.secrets.post({ body: manifest })
		})
	}

	getConfig() {
		return this.listSecrets().then(res => {
			let ret = {}
			_.forEach(res.body.items, secret => {
				if (
					_.has(
						secret.data,
						secret.metadata.name.toUpperCase().replace(/-/g, '_'),
					)
				)
					_.forEach(secret.data, (value, name) => {
						if (value === null) ret[name] = ''
						else ret[name] = Buffer.from(value, 'base64').toString()
					})
			})
			return ret
		})
		return ret
	}

	update(envvars) {
		let promises = []
		_.forEach(envvars, pair => {
			let [name, value] = pair
			let k8sSecretName = name.toLowerCase().replace(/_/g, '-')
			promises.push(this.updateSecret(k8sSecretName, name, value))
		})
		return Promise.all(promises).return(envvars)
	}
}
