'use strict';

const _ = require("lodash")
const Promise = require('bluebird')
const { readFileAsync, writeFileAsync } = Promise.promisifyAll(require('fs'))
const path = require('path')
const { loadFromFile, ymlString } = require('../utils')
const { validateFilePath, validateDirectoryPath, validateTopLevelDirectiveYaml } = require('../utils')
const execAsync = Promise.promisify(require('child_process').exec)

module.exports = class Transformer {

	constructor(input, composefile, target, environment, output, verbose) {
		this.input = input
		this.composefile = composefile
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
			validateFilePath(path.join(this.input, this.composefile)).then(error => {
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
		).then(() => {
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
			return loadFromFile(path.join(this.input, this.composefile)).then( release => {
				this.release = release
				return loadFromFile(path.join(this.input, 'targets.yml')).then( targets => {
					let releaseComponents = _.keys(_.get(this.release, 'services'))
					if (!releaseComponents.length){
						errors = errors.concat('The release contains no components.\n' +
							'Please check: ' + path.join(this.input, this.composefile))
						return [ null, errors]
					}
					_.merge(this.release.services, _.pick(_.get(targets, this.target), releaseComponents))
					return loadFromFile(path.join(this.input, 'environments.yml')).then( environments => {
						_.merge(this.release.services, _.pick(_.get(environments, this.environment), releaseComponents))
						return [this.release, errors]
					})
				})
			})
		}).then(([release, errors]) => {
			// Override environment variables from environment.
			// as compose has no secrets primitive (unless swarm node),
			// empty environment variables in environment.yml are used as secrets.
			if (this.target === 'compose') {
				_.mapValues(this.release.services, (o) => {
					if (o.environment){
						_.mapKeys(o.environment, (value, envvar) => {
							if (_.get(process.env, envvar)){
								_.set(o.environment, envvar, _.get(process.env, envvar))
							}
						})
					}
				})
			}
			return [this.release, errors]
		})
	}

	write() {
		return this.transform()
			.then(([release, errors]) => {
				if (this.output === '' ){
					if (this.target === 'kubernetes'){
						writeFileAsync('/tmp/katapult.tmp.out', ymlString(release)).then(
							execAsync('env -i kompose convert -f /tmp/katapult.tmp.out --stdout').then( output => {
								// TODO: inject secrets, in case we use this for k8s.
								console.log(output)
							})
						)
						return [release, errors]
					}
					else{
						console.log(ymlString(release))
						return [release, errors]
					}
				}
				else {
					return writeFileAsync(this.output, ymlString(release))
						.then(() => {
							execAsync(`env -i kompose convert -f "${this.output}"`).then(() => {
								// inject kubernetes secrets from environment
								_.mapKeys(this.release.services, (serviceDefinition, serviceName) => {
									Transformer.createSecrets(serviceDefinition, serviceName)
								})
							})
							return [release, errors]
						})
				}
			})
	}

	static createSecrets(serviceDefinition, serviceName){
		if (serviceDefinition.environment){
			let secrets = {
				kind: 'Secret',
				apiVersion: 'v1',
				metadata: null,
				type: 'Opaque',
				data: null
			}
			let deploymentPath = `${serviceName}-deployment.yaml`
			loadFromFile(deploymentPath).then((obj) => {
				_.set(secrets, 'metadata.name', serviceName)
				_.mapKeys(serviceDefinition.environment, (value, envvar) => {
					if (_.get(process.env, envvar)){
						// remove any existing envvar. Will be overriden by a secret.
						_.remove(obj.spec.template.spec.containers[0].env, (n) => {
							return n.name === envvar;
						});
						// create secret and add reference to env.
						obj.spec.template.spec.containers[0].env.push({
							name: envvar,
							value:{ valueFrom: {secretKeyRef: { name: `${serviceName}-secrets`, key: envvar}}}
						})
						_.set(secrets, ['data', envvar], new Buffer.from(_.get(process.env, envvar)).toString('base64'))
					}
				})
				return [obj, secrets]
			}).then(([obj, secrets])=>{
				writeFileAsync(deploymentPath, ymlString(obj))
				writeFileAsync(`${serviceName}-secrets.yaml`, ymlString(secrets))
			})
		}
	}
}
