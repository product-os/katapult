'use strict';

const _ = require("lodash")
const Promise = require('bluebird')
const { writeFileAsync, renameAsync } = Promise.promisifyAll(require('fs'))
const path = require('path')
const { loadFromFile, ymlString } = require('../utils')
const { validateFilePath, validateDirectoryPath, validateTopLevelDirectiveYaml } = require('../utils')
const execAsync = Promise.promisify(require('child_process').exec)

module.exports = class TemplateGenerator {

	constructor(input, composefile, target, output, verbose) {
		this.input = input
		this.composefile = composefile
		this.target = target
		this.output = output
		this.verbose = verbose
		this.release = null
	}

	validate() {
		let errors = []
		return Promise.join(
			validateDirectoryPath(this.input).then(error => {
				if (error) errors.push(error)
			}),
			validateFilePath(path.join(this.input, this.composefile)).then(error => {
				if (error) errors.push(error)
			}),
			validateFilePath(path.join(this.input, 'targets.yml')).then(error => {
				if (error) errors.push(error)
			}),
			() => {
				return errors
			}
		).then( () => {
			if (_.includes(['kubernetes', 'kubernetes-local'], this.target))
				validateDirectoryPath(this.output).then(error => {
					if (error) errors.push(error)
				})
			else validateDirectoryPath(path.dirname(this.output)).then(error => {
				if (error) errors.push(error)
			})
		})
		.then(() => {
			return validateTopLevelDirectiveYaml(this.target, path.join(this.input, 'targets.yml')).then(error => {
				if (error) errors=errors.concat(error)
			}).return(errors)
		})
	}

	transform() {
		return this.validate().then( (errors) => {
			if (errors.length) return [null, errors]
			return loadFromFile(path.join(this.input, this.composefile)).then(release => {
				this.release = release
				return loadFromFile(path.join(this.input, 'targets.yml')).then( targets => {
					let releaseComponents = _.keys(_.get(this.release, 'services'))
					if (!releaseComponents.length){
						errors.push('The release contains no components.\n' +
							'Please check: ' + path.join(this.input, this.composefile))
						return [ null, errors]
					}
					_.forEach(_.get(this.release, 'services'), svc => {
						_.merge(svc, _.get(targets, this.target))
					})
					return [this.release, errors]
				}).then(this.templateReleaseVars())
					.then(() => {
						return loadFromFile('etc/settings.yml')
					})
					.then((settings) => {
						if (_.includes(['kubernetes', 'kubernetes-local'], this.target)) {
							this.applyTemplateEnvironmentLabels(_.get(settings, 'supported-environment-template-labels'))
						}
					})
					.then(() => {
						// if  k8s, translate
						if (_.includes(['kubernetes', 'kubernetes-local'], this.target)){
							// currently kompose doesn't support stdin, or output to specific directory...
							let tmpFile = '/tmp/katapult.tmp.out.yml'
							return writeFileAsync(tmpFile, ymlString(this.release))
								.then(() => {
									return execAsync(`env -i kompose convert -f ${tmpFile}`).then(() => {
										// inject kubernetes secrets from environment
										return this.replaceSecretsK8sSpec()
									}).then(() => {return [this.release, errors]})
								})
						}
				})
			})
		})
	}

	write() {
		return this.transform()
			.then(([release, errors]) => {
				if (_.includes(['kubernetes', 'kubernetes-local'], this.target)){
					let moved = []
					// move components definition to output folder
					execAsync(`ls *-*.yaml`).then(output => {
						_.forEach(output.trim().split('\n'), templateFile => {
							moved.push(renameAsync(templateFile, path.join(this.output, templateFile)))
						})
					})
					return Promise.all(moved).then(() => {
						return [release, errors]
					})
				}
				else {
					return writeFileAsync(this.output, ymlString(release)).then(() => {
						return [release, errors]
					})
				}

			})
	}

	templateReleaseVars(){
		_.forEach(_.get(this.release, 'services'), svc => {
			// template envvars
			_.forEach(_.keys(_.get(svc, 'environment')), envvarKey => {
				_.set(svc.environment, envvarKey, `{{{environment.${envvarKey}}}}`)
			})
		})
		return this.release
	}

	applyTemplateEnvironmentLabels(labels){
		_.forEach(_.get(this.release, 'services'), (svc, serviceName)=> {
			_.forEach(labels, (value, label) => {
				_.set(svc.labels, [`${label}`], `{{{${serviceName}.${value}}}}`)
			})
		})
	}

	replaceSecretsK8sSpec(){
		// We need serviceDefinition for getting secret names,
		// as they are skipped by kompose convert due to null values.
		let replaced = []
		_.mapKeys(this.release.services, (serviceDefinition, serviceName) => {
			let deploymentPath = `${serviceName}-deployment.yaml`
			replaced.push(
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
				})
				.then((obj) => {
					return writeFileAsync(deploymentPath, ymlString(obj))
				})
			)
		})
		return Promise.all(replaced)
	}
}
