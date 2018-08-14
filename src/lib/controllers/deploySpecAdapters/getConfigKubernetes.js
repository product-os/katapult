'use strict'
const k8s = require('@kubernetes/client-node')
const _ = require('lodash')

const getConfig = (kubeconfigPath) => {
	console.log(kubeconfigPath)
	let k8sAPI = k8s.Config.fromFile(kubeconfigPath)

	return k8sAPI.readNamespacedSecret('katapult-deploy-guard', 'default')
		.then(res => {
			let ret = {}
			_.forEach(res.body.data, (val, key) => {
				ret[key] = Buffer.from(val, 'base64').toString('utf8')
			})
			return ret
		})
}
module.exports = getConfig