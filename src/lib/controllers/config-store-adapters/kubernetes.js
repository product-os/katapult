'use strict'
const { config, Client } = require('kubernetes-client')
const Promise = require('bluebird')
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
			passphrase: _.get(attrs, 'bastion-key-pass'),
		}
	}

	async listSecrets() {
		await this.client.loadSpec()
		const secrets = await this.client.api.v1
			.namespaces(this.namespace)
			.secrets.get()
		return secrets
	}

	async deleteSecret(secretName) {
		await this.client.loadSpec()
		try {
			await this.client.api.v1
				.namespaces(this.namespace)
				.secrets(secretName)
				.delete()
			return true
		} catch (err) {
			return false
		}
	}

	async updateSecret(k8sSecretName, name, value) {
		await this.client.loadSpec()
		const patchManifest = {
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
		try {
			await this.client.api.v1
				.namespaces(this.namespace)
				.secrets(k8sSecretName)
				.patch({ body: patchManifest })
			return true
		} catch (err) {
			return false
		}
	}

	getConfig() {
		if (this.bastion) {
			return runInTunnel(this.tnlConfig, this.readConfig())
		}
		return this.readConfig()
	}

	async readConfig() {
		const secrets = await this.listSecrets()
		let ret = {}
		_.forEach(secrets.body.items, secret => {
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
	}

	update(envvars) {
		if (this.bastion) {
			return runInTunnel(this.tnlConfig, this.updateEnvvars(envvars))
		}
		return this.updateEnvvars(envvars)
	}

	updateEnvvars(envvars) {
		return Promise.map(envvars, ([name, value]) => {
			let k8sSecretName = name.toLowerCase().replace(/_/g, '-')
			this.updateSecret(k8sSecretName, name, value)
		}).return(envvars)
	}
}
