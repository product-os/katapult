'use strict'
const k8s = require('@kubernetes/client-node')
const _ = require('lodash')


module.exports = class configStore {
	constructor(kubeconfigPath, namespace) {
		this.kubeconfigPath = kubeconfigPath
		this.namespace = namespace
		this.k8sAPI = k8s.Config.fromFile(this.kubeconfigPath)
	}

	getConfig() {
		return this.k8sAPI.listNamespacedSecret(this.namespace)
			.then(res => {
				let ret = {}
				_.forEach(res.body.items, (secret) => {
					if (_.has(secret.data, secret.metadata.name.toUpperCase().replace(/-/g,'_') ))
						_.forEach(secret.data, (value, name) => {
							if(value === null) ret[name] = ''
							else ret[name] = Buffer.from(value, 'base64').toString()
						})
				})
				return ret
			})
	}

	update(envvars) {
		_.forEach(envvars, (pair) => {
			let [name, value] = pair
			let k8sSecretName = name.toLowerCase().replace(/_/g,'-')
			let secretObj = {
				APIVersion: 'v1',
				Kind: 'Secret',
				metadata: {
					name: k8sSecretName
				},
				type: 'Opaque',
				data:{
					[name]: Buffer.from(value).toString('base64')
				}
			}

			return this.k8sAPI.deleteNamespacedSecret(k8sSecretName, this.namespace, {})
				.catch((e) => { if (e.body.reason !== 'NotFound') throw(e)})
				.finally(() => {
					return this.k8sAPI.createNamespacedSecret(this.namespace, secretObj)
				})
		})
		return envvars
	}
}
