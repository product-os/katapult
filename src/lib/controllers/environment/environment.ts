import * as fs from 'mz/fs';
import * as path from 'path';
import { safeLoad } from 'js-yaml';

export interface EnvFileConfigStoreDefinition {
	path: string;
}

export interface Environment {
	version: string;
	'config-store': {
		envfile?: EnvFileConfigStoreDefinition;
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
