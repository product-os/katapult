import * as path from 'path';
import * as Promise from 'bluebird';
import * as rimraf from 'rimraf';
import * as simplegit from 'simple-git/promise';
import { DeployAdapter, DeployConfig } from '.';

export class BalenaDeployment extends DeployAdapter {
	git: simplegit.SimpleGit;
	remote: string;
	pkPath: string;

	constructor({ environmentName, environmentObj }: DeployConfig) {
		super({ environmentName, environmentObj });
		this.deploySpecBasePath = path.join(
			environmentObj['archive-store'],
			environmentName,
			environmentObj.version,
			'balena',
		);
		this.git = simplegit(this.deploySpecBasePath);
		this.remote = environmentObj['balena']['deploy-git-remote'];
		this.pkPath = environmentObj['balena']['deploy-pk-path'];
	}

	run() {
		let GIT_SSH_COMMAND =
			'ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -i ' +
			this.pkPath;
		let commitMessage = 'katapult-deploy-' + new Date().toISOString();

		return Promise.resolve(
			rimraf
				.__promisify__(path.join(this.deploySpecBasePath, '.git'))
				.then(() => {
					return this.git.env('GIT_SSH_COMMAND', GIT_SSH_COMMAND).init();
				})
				.then(() => {
					return this.git.addConfig('user.name', 'Katapult');
				})
				.then(() => {
					return this.git.addConfig('user.email', 'katapult@balena.io');
				})
				.then(() => {
					return this.git.add('.');
				})
				.then(() => {
					return this.git.commit(commitMessage);
				})
				.then(() => {
					return this.git.addRemote('origin', this.remote);
				})
				.then(() => {
					return this.git.push('origin', 'master');
				}),
		);
	}
}
