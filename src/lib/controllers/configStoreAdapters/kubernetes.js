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
}
