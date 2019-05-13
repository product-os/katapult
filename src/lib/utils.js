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
const tunnelAsync = Promise.promisify(require('tunnel-ssh'))
const execAsync = Promise.promisify(require('child_process').exec)
const gitP = require('simple-git/promise')
const yaml = require('yamljs')
const path = require('path')

const validateFilePath = (path, raise = true) => {
	return statAsync(path)
		.then(stat => {
			if (!stat.isFile()) {
				if (raise) {
					throw new Error('Error: ' + path + ' is not a file')
				}
				return false
			}
			return true
		})
		.catch(error => {
			if (raise) throw error
			else return false
		})
}

const validateDirectoryPath = (path, raise = true) => {
	return statAsync(path)
		.then(stat => {
			if (!stat.isDirectory()) {
				if (raise) {
					throw new Error('Error: ' + path + ' is not a directory')
				}
				return false
			}
			return true
		})
		.catch(error => {
			if (raise) throw error
			else return false
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
				`Error parsing '${yamlPath}'\n` +
					`'${name}' not defined in '${yamlPath}'\n` +
					`Available options: ${_.keys(obj)}`
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
				}
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
			path.join(configurationPath, 'environments.yml')
		).then(() => {
			return parseEnvironmentConfiguration(configurationPath, environment)
		})
	})
}

/**
 * Creates an ssh tunnel for executing a promise
 * @param tnlConfig: ssh2 tunnel configuration object
 * @param prom: promise
 * @returns {Promise<T>}
 */
const runInTunnel = (tnlConfig, prom) => {
	return tunnelAsync(tnlConfig).then(tnl => {
		return prom.then(ret => {
			if (tnl) {
				tnl.close()
			}
			return ret
		})
	})
}

/**
 * Converts paths of configuration in relative to basePath paths
 * @param basePath
 * @param configuration
 * @returns {*}
 */
const pathsRelativeTo = (basePath, configuration) => {
	console.log(path.join(basePath, configuration['archive-store']))
	_.forEach(configuration, (attrs, target) => {
		_.map(['template', 'config-store', 'bastion-key', 'kubeconfig'], key => {
			if (_.get(attrs, key, false)) {
				configuration[target][key] = path.join(basePath, attrs[key])
			}
		})
	})
	configuration['archive-store'] = path.join(
		basePath,
		configuration['archive-store']
	)
	return configuration
}

const parseEnvironmentConfiguration = (configurationPath, environmentName) => {
	return loadFromFile(path.join(configurationPath, 'environments.yml')).then(
		conf => {
			return pathsRelativeTo(configurationPath, _.get(conf, environmentName))
		}
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
							`Git remote: ${repoURI} doesn't match ${repoPath} existing remote: ${remote}`
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

/**
 * Keyframe unwrapper.
 * @param keyframePaths: A list of paths for searching for a keyframe file.
 * @returns {Promise<Object | undefined>} Keyframe object
 */
const unwrapKeyframe = async keyframePaths => {
	const validPaths = await Promise.map(keyframePaths, kfPath => {
		return validateFilePath(kfPath, false)
	})
	const keyframePath = keyframePaths[validPaths.indexOf(true)]
	if (keyframePath) {
		let keyframe = await loadFromFile(keyframePath)
		keyframe = _.filter(
			_.get(keyframe, ['children', 'sw', 'containerized-application'], []),
			component => {
				return component.type === 'sw.containerized-application'
			}
		)
		keyframe = _.mapValues(_.keyBy(keyframe, 'slug'), o => {
			return _.merge(o.assets, { version: o.version })
		})
		return keyframe
	} else {
		return {}
		// throw new Error('Error: Keyframe not found in ' + keyframePaths)
	}
}

exports.validateEnvironmentConfiguration = validateEnvironmentConfiguration
exports.parseEnvironmentConfiguration = parseEnvironmentConfiguration
exports.validateTopLevelDirectiveYaml = validateTopLevelDirectiveYaml
exports.loadFromJSONFileOrNull = loadFromJSONFileOrNull
exports.validateDirectoryPath = validateDirectoryPath
exports.scrubk8sMetadataMatch = scrubk8sMetadataMatch
exports.ensureRepoInPath = ensureRepoInPath
exports.validateFilePath = validateFilePath
exports.renameFilesMatch = renameFilesMatch
exports.scrubk8sMetadata = scrubk8sMetadata
exports.loadFromJSONFile = loadFromJSONFile
exports.unwrapKeyframe = unwrapKeyframe
exports.moveFilesMatch = moveFilesMatch
exports.loadFromFile = loadFromFile
exports.runInTunnel = runInTunnel
exports.ymlString = ymlString
