import * as Promise from 'bluebird';
import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';
import { runInTunnel } from '../../utils';
import { exec } from 'child_process';
import { DeployConfig, DeployAdapter } from '.';
import { ConnectConfig } from 'tunnel-ssh';

const execAsync = Promise.promisify(exec);

export class KubernetesDeployment extends DeployAdapter {
	kubeconfigPath: string;
	bastion: any;
	tunnelConfig: ConnectConfig;

	constructor({ environmentName, environmentObj }: DeployConfig) {
		super({ environmentName, environmentObj });
		this.deploySpecBasePath = path.join(
			environmentObj['archive-store'],
			environmentName,
			environmentObj.version,
			'kubernetes',
		);
		let attrs = _.get(environmentObj, 'kubernetes');
		this.kubeconfigPath = path.join(attrs.kubeconfig);
		this.bastion = _.get(attrs, 'bastion');
		this.tunnelConfig = {
			username: _.get(attrs, 'bastion-username'),
			host: this.bastion,
			dstHost: _.get(attrs, 'api'),
			port: 22,
			dstPort: 443,
			privateKey: fs.readFileSync(_.get(attrs, 'bastion-key'), 'utf8'),
			localHost: '127.0.0.1',
			localPort: 8443,
			passphrase: _.get(attrs, 'bastion-key-pass'),
		};
	}

	run() {
		if (this.bastion) {
			return runInTunnel(this.tunnelConfig, this.deploy());
		}
		return this.deploy();
	}

	deploy() {
		return execAsync(
			`kubectl --kubeconfig=${this.kubeconfigPath} apply -f ${
				this.deploySpecBasePath
			}`,
		);
	}
}
