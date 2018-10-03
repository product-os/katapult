'use strict'
const Promise = require('bluebird')
const { readFileAsync } = Promise.promisifyAll(require('fs-extra'))
const _ = require('lodash')
const yaml = require('yamljs')

module.exports = class configManifest {
	constructor(configManifestPath) {
		this.configManifestPath = configManifestPath
	}

	getConfigManifest() {
		return readFileAsync(this.configManifestPath, 'utf8')
			.then(yaml.parse)
			.tap(cManifest => {
				configManifest.traverse(cManifest)
			})
	}
	static traverse(obj) {
		_.forIn(obj, function (val, key) {
			// Convert array of properties to object
			if (_.isArray(val) && key==='properties') {
				obj[key]= _.reduce(val, (o, v) => { return _.merge(o, v) }, {})
				obj['additionalProperties'] = false
			}

			if (_.isObject(val)){
				// Add required as default, unless type ends with '?'
				if (_.endsWith(_.get(val, 'type', ''),'?')){
					obj[key]['type']=obj[key]['type'].slice(0,-1)
				}
				else{
					if (!_.includes(['default'], key)){
						obj[key]['required']=true
					}
				}
				// Handle 'hostname', 'email', 'uri' type transformations
				if (_.includes(['hostname', 'email', 'uri'], _.get(val, 'type', ''))){
					obj[key]['format'] = obj[key]['type']
					obj[key]['type'] = 'string'
				}
				configManifest.traverse(obj[key])
			}

			if (_.isArray(val)) {
				val.forEach((el) => {
					if (_.isObject(el)) {
						configManifest.traverse(el)
					}
				})
			}

		})
	}
}
