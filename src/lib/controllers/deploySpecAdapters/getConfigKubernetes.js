'use strict'
const k8s = require('@kubernetes/client-node')
const _ = require('lodash')

const getConfig = (kubeconfigPath, namespace) => {
	let k8sAPI = k8s.Config.fromFile(kubeconfigPath)

	return k8sAPI.listNamespacedSecret(namespace)
		.then(res => {
			let ret = {}
			_.forEach(res.body.items, (secret) => {
				if (_.has(secret.data, secret.metadata.name.toUpperCase().replace(/-/g,'_') ))
					_.forEach(secret.data, (value, name) => {
						ret[name] = Buffer.from(value, 'base64').toString()
					})
			})
			return ret
		})
}
module.exports = getConfig