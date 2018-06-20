'use strict';

const _ = require("lodash")
const Promise = require('bluebird')
const { readFileAsync, statAsync } = Promise.promisifyAll(require('fs'))
const yaml = require('yamljs')

const validateFilePath = (path) => {
	return statAsync(path).then(stat => {
		if (!stat.isFile()){
			return 'Error: ' + path + ' is not a file'
		}
		return false
	}).catch((err) => {
		return err.message
	});
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
	});
}

module.exports.validateTopLevelDirectiveYaml = validateTopLevelDirectiveYaml
module.exports.validateDirectoryPath = validateDirectoryPath
module.exports.validateFilePath = validateFilePath
module.exports.loadFromFile = loadFromFile
module.exports.ymlString = ymlString
