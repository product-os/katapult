import * as fs from 'mz/fs';
import * as path from 'path';
import { safeLoad } from 'js-yaml';

export interface EnvFileConfigStoreDefinition {
	path: string;
}

export interface KubernetesConfigStoreDefinition {
	// kubeconfig: ... OR from ENV KATAPULT_KUBE_CONFIG
	// endpoint: "https://fkjhfvbwfdjhvbdwsjvhb.com:443/abb1/" OR from ENV KATAPULT_KUBE_ENDPOINT
	// bastion:
	//   host: "1.2.3.4"   OR from ENV KATAPULT_BASTION_HOST
	//   user: "bastion"   OR from ENV KATAPULT_BASTION_USER
	//   key: "kjnackjnaskcjcnkj"   OR from ENV KATAPULT_BASTION_KEY
	//   passphrase: "secret"   OR from ENV KATAPULT_BASTION_PASSPHRASE

	kubeconfig?: string; // should be Base64
	namespace?: string;
	bastion?: {
		apiHost?: string;
		apiPort?: string;
		host?: string;
		port?: string;
		user?: string;
		key?: string;
		passphrase?: string;
	};
}

export interface Environment {
	version: string;
	'config-store': {
		envfile?: EnvFileConfigStoreDefinition;
		kubernetes?: KubernetesConfigStoreDefinition;
	};
}

export interface EnvironmentContext {
	directory: string;
	environment: Environment;
}

export const loadEnvironment = async (
	environmentPath: string,
): Promise<EnvironmentContext> => {
	let environmentFile: string;
	if ((await fs.stat(environmentPath)).isDirectory()) {
		environmentFile = path.join(environmentPath, 'environment.yml');
	} else {
		environmentFile = environmentPath;
	}

	const directory = path.dirname(environmentFile);
	const yaml = await fs.readFile(environmentFile, 'utf8');
	const environment = safeLoad(yaml) as Environment;

	return {
		directory,
		environment,
	};
};
