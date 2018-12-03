import * as Promise from 'bluebird';
import { ComposeDeployment } from './compose';
import { KubernetesDeployment } from './kubernetes';

export const AvailableDeployAdapters = [
	'balena',
	'compose',
	'docker-compose',
	'kubernetes',
];

export class UnknownDeploymentTargetError extends Error {
	constructor(target: string) {
		super(`Unknown target: ${target}`);
	}
}

export function getDeployAdapter(
	target: string,
	config: DeployConfig,
): Deployable {
	switch (target.toLowerCase().trim()) {
		case 'balena':
		case 'compose':
		case 'docker-compose':
			return new ComposeDeployment(config);
		case 'kubernetes':
			return new KubernetesDeployment(config);
		default:
			throw new UnknownDeploymentTargetError(target);
	}
}

export interface DeployConfig {
	environmentName: string;
	environmentObj: any;
}

export interface Deployable {
	run(): void;
}

export abstract class DeployAdapter implements Deployable {
	config: DeployConfig;
	deploySpecBasePath: string;

	constructor(config: DeployConfig) {
		this.config = config;
	}
	abstract run(): Promise<void>;
}
