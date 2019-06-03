import { Environment } from '.';

import { keys } from 'lodash';
import { dirname, join, resolve } from 'path';
import { getAbsoluteURI, loadFromFile } from '../../tools';
import { validateDirectoryPath } from '../../validators';

import { get, set } from 'lodash';

export class EnvironmentValidator {
	private readonly configurationPath: string;

	public constructor(configurationPath: string) {
		this.configurationPath = configurationPath;
	}

	async validate(): Promise<Environment> {
		const relativeEnvironment = (await loadFromFile(
			this.configurationPath,
		)) as Environment;
		const environment = this.convertRelativePaths(relativeEnvironment);

		for (const target of keys(environment.deployTarget)) {
			const targetTemplatesPath = join(
				environment.productRepo,
				'deploy',
				target,
				'templates',
			);
			try {
				await validateDirectoryPath(targetTemplatesPath);
			} catch (e) {
				e.message =
					`Unable to access deploy target template folder: ${targetTemplatesPath}\n` +
					e.message;
				throw new Error(e.message);
			}
		}
		return environment;
	}

	convertRelativePaths(environment: Environment): Environment {
		// Convert relative to absolute URIs
		const keys = [
			'productRepo',
			'archiveStore',
			'encryptionKeyPath',
			'configStore.envFile.path',
			'deployTarget.kubernetes.kubeConfigPath',
			'deployTarget.kubernetes.bastion.key',
			'deployTarget.compose.socket',
		];
		const basePath = dirname(resolve(this.configurationPath));

		for (const k of keys) {
			const value = get(environment, k);
			if (value) {
				set(environment, k, getAbsoluteURI(value, basePath));
			}
		}
		return environment;
	}
}
