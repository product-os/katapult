import * as yamljs from 'yamljs';
import * as fs from 'mz/fs';
import * as path from 'path';

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
	if (fs.statSync(environmentPath).isDirectory()) {
		environmentFile = path.join(environmentPath, 'environment.yml');
	} else {
		environmentFile = environmentPath;
	}

	const directory = path.dirname(environmentFile);
	const yaml = await fs.readFile(environmentFile, 'utf8');
	const environment = yamljs.parse(yaml) as Environment;

	return {
		directory,
		environment,
	};
};
