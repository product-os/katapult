'use strict';

const _ = require("lodash")
const Promise = require('bluebird')
const { writeFileAsync } = Promise.promisifyAll(require('fs'))
const path = require('path')
const { loadFromFile, ymlString } = require('../utils')
const { validateFilePath, validateDirectoryPath, validateTopLevelDirectiveYaml } = require('../utils')
const execAsync = Promise.promisify(require('child_process').exec)

module.exports = class Transformer {

	constructor(input, komposefile, target, environment, output, verbose) {
		this.input = input
		this.komposefile = komposefile
		this.target = target
		this.environment = environment
		this.output = output
		this.verbose = verbose
		this.release = null
	}

	validate() {
		let errors = []
		return Promise.join(
			validateDirectoryPath(this.input).then(error => {
				if (error) errors=errors.concat(error)
			}),
			validateFilePath(path.join(this.input, this.komposefile)).then(error => {
				if (error) errors=errors.concat(error)
			}),
			validateFilePath(path.join(this.input, 'targets.yml')).then(error => {
				if (error) errors=errors.concat(error)
			}),
			validateFilePath(path.join(this.input, 'environments.yml')).then(error => {
				if (error) errors=errors.concat(error)
			}),
			() => {
				return errors
			}
		).then( () => {
			if (_.includes(['kubernetes', 'kubernetes-local'], this.target))
				validateDirectoryPath(this.output).then(error => {
					// Define the kompose temporary output filename.
					this.output = path.join(this.output,'kompose.yml')
					if (error) errors=errors.concat(error)
				})
			else validateFilePath(this.output).then(error => {
				if (error) errors=errors.concat(error)
			})
		})
			.then(() => {
			return Promise.join(
				validateTopLevelDirectiveYaml(this.target, path.join(this.input, 'targets.yml')).then(error => {
					if (error) errors=errors.concat(error)
				}),
				validateTopLevelDirectiveYaml(this.environment, path.join(this.input, 'environments.yml')).then(error => {
					if (error) errors=errors.concat(error)
				}),
				() => {
					return errors
				}
			)
		})
	}

	transform() {
		return this.validate().then( (errors) => {
			if (errors.length) return [null, errors]
			return loadFromFile(path.join(this.input, this.komposefile)).then(release => {
				this.release = release
				return loadFromFile(path.join(this.input, 'targets.yml')).then( targets => {
					let releaseComponents = _.keys(_.get(this.release, 'services'))
					if (!releaseComponents.length){
						errors = errors.concat('The release contains no components.\n' +
							'Please check: ' + path.join(this.input, this.komposefile))
						return [ null, errors]
					}
					_.merge(this.release.services, _.pick(_.get(targets, this.target), releaseComponents))
					return [this.release, errors]
				}).then(() => {
					let releaseComponents = _.keys(_.get(this.release, 'services'))
					return loadFromFile(path.join(this.input, 'environments.yml')).then( environments => {
						_.merge(this.release.services, _.pick(_.get(environments, this.environment), releaseComponents))
						let envvarsMap = _.get(_.get(environments, this.environment, {}), 'environment', {})
						if (envvarsMap) {
							_.forEach(_.get(this.release, 'services'), svc => {
								_.forEach(_.keys(_.get(svc, 'environment')), envvarKey => {
									let envvarVal = _.get(envvarsMap, envvarKey)
									if (envvarVal !== undefined)_.set(svc.environment, envvarKey, envvarVal)
									else errors = errors.concat('ENVVAR: ' + envvarKey + ' is not defined.')
									// FIXME: refine error message for secrets.
								})
							})
						}
						return [this.release, errors]
					})
				})
			})
		})
	}

	write() {
		return this.transform()
			.then(([release, errors]) => {
				if (_.includes(['kubernetes', 'kubernetes-local'], this.target)){
					writeFileAsync(this.output, ymlString(release))
						.then(() => {
							execAsync(`env -i kompose convert -f ${this.output}`).then(() => {
								// inject kubernetes secrets from environment
								Transformer.replaceSecretsinFile(this.release.services)
							})
						})
				}
				else {
					writeFileAsync(this.output, ymlString(release))
				}
				return [release, errors]
			})
	}

	static replaceSecretsinFile(services){
		// We need serviceDefinition for getting secret names,
		// as they are skipped by kompose convert due to null values.
		_.mapKeys(services, (serviceDefinition, serviceName) => {
			let deploymentPath = `${serviceName}-deployment.yaml`
			loadFromFile(deploymentPath).then((obj) => {
				_.mapKeys(serviceDefinition.environment, (value, envvar) => {
					if (_.startsWith(envvar, 'SECRET_')) {
						_.remove(obj.spec.template.spec.containers[0].env, (n) => {
							return n.name === envvar;
						});
						obj.spec.template.spec.containers[0].env.push({
							name: envvar,
							valueFrom: {secretKeyRef: {name: 'katapult-secrets', key: envvar}}
						})
					}
				})
				return obj
			}).then((obj) => {
				writeFileAsync(deploymentPath, ymlString(obj))
			})
		})
	}
}
