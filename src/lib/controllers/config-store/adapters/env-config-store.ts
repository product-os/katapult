import { promisify } from 'bluebird';
import { parse } from 'dotenv';
import { readFile, writeFile } from 'fs';
import * as _ from 'lodash';

import { configMapToPairs, kvPairsToConfigMap } from '../../../tools';

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

import { ConfigStoreAccess, EnvConfigStoreAccess } from '../../environment';
import { ConfigMap } from '../index';

export class EnvConfigStoreAdapter {
	private readonly access: EnvConfigStoreAccess;

	public constructor(access: ConfigStoreAccess) {
		if (!access.envFile) {
			throw new Error('envFile not specified');
		}

		this.access = {
			path: access.envFile.path || 'env',
		};
	}

	async listPairs(): Promise<ConfigMap> {
		const envFileBuffer = await readFileAsync(this.access.path);
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

	async updateMany(envvars: ConfigMap) {
		const envvarPairs = configMapToPairs(envvars);
		const conf = await this.listPairs();

		for (const name of _.keys(envvarPairs)) {
			conf[name] = envvarPairs[name];
		}
		await this.writeEnvFile(conf);
		return await this.list();
	}

	private async writeEnvFile(config: ConfigMap) {
		let dotenvString = '';
		for (const name of _.keys(config)) {
			dotenvString += `${name}="${config[name]}"\n`;
		}
		// @ts-ignore
		return writeFileAsync(this.access.path, dotenvString);
	}
}
