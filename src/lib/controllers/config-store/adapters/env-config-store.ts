import { parse } from 'dotenv';
import * as _ from 'lodash';
import * as fs from 'mz/fs';

import { configMapToPairs, kvPairsToConfigMap } from '../../../tools';

import { ConfigStoreAdapterError } from '../../../error-types';
import { ConfigStoreAccess, EnvConfigStoreAccess } from '../../environment';
import { ConfigMap } from '../index';

export class EnvConfigStoreAdapter {
	private readonly access: EnvConfigStoreAccess;

	public constructor(access: ConfigStoreAccess) {
		if (!access.envFile) {
			throw new ConfigStoreAdapterError('envFile not specified');
		}

		this.access = {
			path: access.envFile.path || 'env',
		};
	}

	async listPairs(): Promise<ConfigMap> {
		const envFileBuffer = await fs.readFile(this.access.path);
		return parse(
			envFileBuffer
				.toString()
				.split('\\r')
				.join('\r'),
		);
	}

	async list(): Promise<ConfigMap> {
		const configManifest = await this.listPairs();
		return kvPairsToConfigMap(configManifest);
	}

	async updateMany(envvars: ConfigMap): Promise<ConfigMap> {
		const envvarPairs = configMapToPairs(envvars);
		const conf = await this.listPairs();

		for (const name of _.keys(envvarPairs)) {
			conf[name] = envvarPairs[name];
		}
		await this.writeEnvFile(conf);
		return await this.list();
	}

	private async writeEnvFile(config: ConfigMap): Promise<void> {
		let dotenvString = '';
		for (const name of _.keys(config)) {
			dotenvString += `${name}="${config[name]}"\n`;
		}

		return fs.writeFile(this.access.path, dotenvString);
	}
}
