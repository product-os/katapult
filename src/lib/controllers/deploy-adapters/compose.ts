import * as Promise from 'bluebird';
import * as path from 'path';
import * as child_process from 'child_process';
import * as _ from 'lodash';
import { DeployAdapter, DeployConfig } from '.';
const execAsync = Promise.promisify(child_process.exec);

export class ComposeDeployment extends DeployAdapter {
	constructor({ environmentName, environmentObj }: DeployConfig) {
		super({ environmentName, environmentObj });
		this.deploySpecBasePath = path.join(
			environmentObj['archive-store'],
			environmentName,
			environmentObj.version,
			'docker-compose',
		);
	}

	run() {
		console.log('Deploying ', this.deploySpecBasePath + '/docker-compose.yml');
		return execAsync(
			`docker-compose -f ${this.deploySpecBasePath}/docker-compose.yml up -d `,
		).return();
	}
}
