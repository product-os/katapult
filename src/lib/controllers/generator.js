'use strict';

const _ = require("lodash")
const Promise = require('bluebird')
const { writeFileAsync } = Promise.promisifyAll(require('fs'))
const path = require('path')
const { loadFromFile, ymlString } = require('../utils')

module.exports = class Generator {

	constructor(input, mode, target, environment, output, verbose) {
		this.input = input
		this.mode = mode
		this.target = target
		this.environment = environment
		this.output = output
		this.verbose = verbose
		this.release = null
	}

	generate() {
		return loadFromFile(path.join(this.input, 'components.yml')).then( components => {
			return loadFromFile(path.join(this.input, 'modes.yml')).then( modes => {
				this.release = _.pick(components, _.get(modes, this.mode))
				let modeComponents = _.get(modes, this.mode)
				return loadFromFile(path.join(this.input, 'targets.yml')).then( targets => {
					if(_.keys(this.release).length !== _.get(modes, this.mode).length){
						console.log(_.filter(modeComponents, _.keys(this.release)))
					}
					_.merge(this.release, _.pick(_.get(targets, this.target), modeComponents))
					return loadFromFile(path.join(this.input, 'environments.yml')).then( environments => {
						_.merge(this.release, _.pick(_.get(environments, this.environment), modeComponents))
						return this.release
					})
				})
			})
		})
	}

	write() {
		return this.generate().then(release => {
			if (this.output === '' ){
				console.log(ymlString(release))
				return ymlString(release)
			}
			else {
				return writeFileAsync(this.output, ymlString(release))
			}
		})
	}

}

