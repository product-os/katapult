'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const {
	readFileAsync,
	writeFileAsync,
	statAsync,
	renameAsync,
} = Promise.promisifyAll(require('fs'))
const mvAsync = Promise.promisify(require('mv'))
const execAsync = Promise.promisify(require('child_process').exec)
const gitP = require('simple-git/promise')
const yaml = require('yamljs')
const path = require('path')

const validateFilePath = path => {
	return statAsync(path).then(stat => {
		if (!stat.isFile()) {
			throw new Error('Error: ' + path + ' is not a file')
		}
		return true
	})
}

const validateDirectoryPath = path => {
	return statAsync(path).then(stat => {
		if (!stat.isDirectory()) {
			throw new Error('Error: ' + path + ' is not a directory')
		}
		return true
	})
}

const loadFromFile = filePath => {
	return readFileAsync(filePath, 'utf8').then(yaml.parse)
}

const loadFromJSONFile = filePath => {
	return readFileAsync(filePath, 'utf8').then(JSON.parse)
}

const loadFromJSONFileOrNull = filePath => {
	if (filePath) {
		return statAsync(filePath)
			.then(stat => {
				if (!stat.isFile()) {
					return null
				}
				return loadFromJSONFile(filePath)
			})
			.catch(() => {
				// ToDo: refine
				return null
			})
	}
	return null
}

const ymlString = ymlObj => {
	return yaml.stringify(ymlObj, 40, 2)
}

const validateTopLevelDirectiveYaml = (name, yamlPath) => {
	return loadFromFile(yamlPath).then(obj => {
		if (!_.get(obj, name)) {
			throw new Error(
				"Error parsing '" +
					yamlPath +
					"'\n" +
					"'" +
					name +
					"' not defined in '" +
					yamlPath +
					"' \n Available options: " +
					_.keys(obj),
			)
		}
		return true
	})
}

const moveFilesMatch = (pattern, dest) => {
	return execAsync('ls ' + pattern).then(output => {
		return Promise.map(output.trim().split('\n'), filePath => {
			return mvAsync(filePath, path.join(dest, filePath))
		})
	})
}

const renameFilesMatch = (pathPattern, pattern, replacement) => {
	return execAsync('ls ' + pathPattern).then(output => {
		return Promise.map(output.trim().split('\n'), filePath => {
			return renameAsync(filePath, _.replace(filePath, pattern, replacement))
		})
	})
}

const scrubk8sMetadata = (annotationPrefix, manifestPath) => {
	return loadFromFile(manifestPath).then(manifest => {
		if (_.get(manifest, 'metadata.annotations', false)) {
			manifest.metadata.annotations = _.pickBy(
				manifest.metadata.annotations,
				function(value, key) {
					return !_.startsWith(key, annotationPrefix)
				},
			)
		}
		return writeFileAsync(manifestPath, ymlString(manifest))
	})
}

const scrubk8sMetadataMatch = (filesPattern, annotationPrefix) => {
	return execAsync('ls ' + filesPattern).then(output => {
		return Promise.map(output.trim().split('\n'), manifestPath => {
			return scrubk8sMetadata(annotationPrefix, manifestPath)
		})
	})
}

const validateEnvironmentConfiguration = (configurationPath, environment) => {
	// TODO: git validation.
	return validateDirectoryPath(configurationPath).then(() => {
		return validateTopLevelDirectiveYaml(
			environment,
			path.join(configurationPath, 'environments.yml'),
		).then(() => {
			return parseEnvironmentConfiguration(configurationPath, environment)
		})
	})
}

const parseEnvironmentConfiguration = (configurationPath, environmentName) => {
	return loadFromFile(path.join(configurationPath, 'environments.yml')).then(
		conf => {
			return _.get(conf, environmentName)
		},
	)
}

const ensureRepoInPath = (repoURI, repoPath) => {
	repoURI = repoURI.trim()
	return statAsync(repoPath)
		.then(stat => {
			if (stat.isDirectory()) {
				const repo = gitP(repoPath)
				return repo.listRemote(['--get-url']).then(remote => {
					// Validate remotes match
					remote = remote.trim()
					if (
						remote === repoURI ||
						(_.includes(remote, repoURI) &&
							remote.replace(repoURI, '') === '.git') ||
						(_.includes(repoURI, remote) &&
							repoURI.replace(remote, '') === '.git')
					) {
						return true
					} else {
						throw new Error(
							'Git remote: ' +
								repoURI +
								" doesn't match " +
								repoPath +
								' existing remote: ' +
								remote,
						)
					}
				})
			}
			return gitP().clone(repoURI, repoPath)
		})
		.catch(err => {
			if (err.code === 'ENOENT') {
				return gitP().clone(repoURI, repoPath)
			}
			throw err
		})
}

module.exports.validateEnvironmentConfiguration = validateEnvironmentConfiguration
module.exports.parseEnvironmentConfiguration = parseEnvironmentConfiguration
module.exports.validateTopLevelDirectiveYaml = validateTopLevelDirectiveYaml
module.exports.loadFromJSONFileOrNull = loadFromJSONFileOrNull
module.exports.validateDirectoryPath = validateDirectoryPath
module.exports.scrubk8sMetadataMatch = scrubk8sMetadataMatch
module.exports.ensureRepoInPath = ensureRepoInPath
module.exports.validateFilePath = validateFilePath
module.exports.renameFilesMatch = renameFilesMatch
module.exports.scrubk8sMetadata = scrubk8sMetadata
module.exports.moveFilesMatch = moveFilesMatch
module.exports.loadFromJSONFile = loadFromJSONFile
module.exports.loadFromFile = loadFromFile
module.exports.ymlString = ymlString
