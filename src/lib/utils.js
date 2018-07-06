'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const { readFileAsync, writeFileAsync, statAsync } = Promise.promisifyAll(require('fs'))
const mvAsync = Promise.promisify(require('mv'))
const execAsync = Promise.promisify(require('child_process').exec)
const yaml = require('yamljs')
const path = require('path')

const validateFilePath = (path) => {
	return statAsync(path).then(stat => {
		if (!stat.isFile()){
			return 'Error: ' + path + ' is not a file'
		}
		return false
	}).catch((err) => {
		return err.message
	})
}

const validateDirectoryPath = (path) => {
	return statAsync(path).then(stat => {
		if (!stat.isDirectory()){
			return 'Error: ' + path + ' is not a directory'
		}
		return false
	}).catch((err) => {
		return err.message
	})
}

const loadFromFile = (filePath) => {
	return readFileAsync(filePath, 'utf8')
		.then(yaml.parse)
}

const ymlString = (ymlObj) => {
	return yaml.stringify(ymlObj, 40, 2)
}

const validateTopLevelDirectiveYaml = (name, yamlPath) => {
	return loadFromFile(yamlPath).then(obj => {
		if (!_.get(obj, name))return ['\'' + name + '\' not defined in \'' + yamlPath +'\' \n Available options: ' + _.keys(obj)]
		return []
	}).catch(() => {
		return ['Error parsing \'' + yamlPath + '\'']
	})
}

const moveFilesMatch = (pattern, dest) => {
	return execAsync('ls ' + pattern).then(output => {
		let moved = []
		_.forEach(output.trim().split('\n'), filePath => {
			moved.push(mvAsync(filePath, path.join(dest, filePath)))
		})
		return Promise.all(moved)
	})
}

const scrubk8sMetadata = (annotationPrefix, manifestPath) =>{
	return loadFromFile(manifestPath).then(manifest => {
		if (_.get(manifest, 'metadata.annotations', false)){
			manifest.metadata.annotations = _.pickBy(manifest.metadata.annotations, function(value, key) {
				return !_.startsWith(key, annotationPrefix)
			})
		}
		return writeFileAsync(manifestPath, ymlString(manifest))
	})
}

const scrubk8sMetadataMatch = (filesPattern, annotationPrefix) => {
	return execAsync('ls ' + filesPattern).then(output => {
		let scrubed = []
		_.forEach(output.trim().split('\n'), manifestPath => {
			scrubed.push(scrubk8sMetadata(annotationPrefix, manifestPath))
		})
		return Promise.all(scrubed)
	})
}
module.exports.validateTopLevelDirectiveYaml = validateTopLevelDirectiveYaml
module.exports.validateDirectoryPath = validateDirectoryPath
module.exports.scrubk8sMetadataMatch = scrubk8sMetadataMatch
module.exports.validateFilePath = validateFilePath
module.exports.scrubk8sMetadata = scrubk8sMetadata
module.exports.moveFilesMatch = moveFilesMatch
module.exports.loadFromFile = loadFromFile
module.exports.ymlString = ymlString
