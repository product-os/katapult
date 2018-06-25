'use strict';

const _ = require("lodash")
const Promise = require('bluebird')
const { writeFileAsync } = Promise.promisifyAll(require('fs'))
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
							execAsync(`env -i kompose convert -f "${this.output}"`)
							return [release, errors]
						})
				}
			})
	}
}
