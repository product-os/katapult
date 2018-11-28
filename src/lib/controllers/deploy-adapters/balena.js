'use strict'

const path = require('path')
const simpleGit = require('simple-git')
const fs = require('fs-extra')

module.exports = class Deployment {
	constructor(environmentName, environmentObj, configBasePath) {
		this.deploySpecBasePath = path.join(
			environmentObj['archive-store'],
			environmentName,
			environmentObj.version,
			'balena'
		)
		this.git = simpleGit(this.deploySpecBasePath)
		this.remote = environmentObj['balena']['deploy-git-remote']
		this.pkPath = environmentObj['balena']['deploy-pk-path']
	}

	run() {
		let GIT_SSH_COMMAND =
			'ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -i ' +
			this.pkPath
		let commitMessage = 'katapult-deploy-' + new Date().toISOString()

		return fs.remove(path.join(this.deploySpecBasePath, '.git')).then(() => {
			return this.git
				.env('GIT_SSH_COMMAND', GIT_SSH_COMMAND)
				.init()
				.addConfig('user.name', 'Katapult')
				.addConfig('user.email', 'katapult@balena.io')
				.add('.')
				.commit(commitMessage)
				.addRemote('origin', this.remote)
				.push(['-u', 'origin', 'master', '-f'])
		})
	}
}
