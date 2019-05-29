import { promisify } from 'bluebird';
import { parse } from 'dotenv';
import { readFile, writeFile } from 'fs';
import { keys } from 'lodash';
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

import {
	ConfigStoreAccess,
	EnvConfigStoreAccess,
} from '../../environment-file';
import { ConfigMap } from '../index';

export class EnvConfigStoreAdapter {
	private readonly access: EnvConfigStoreAccess;

	public constructor(access: ConfigStoreAccess) {
		if (!access.envFile) {
			throw new Error('envFile not specified');
		}

		this.access = {
			path: access.envFile.path || 'env',
		} as EnvConfigStoreAccess;
	}

	async list(): Promise<ConfigMap> {
		const envFileBuffer = await readFileAsync(this.access.path);
		return parse(
			envFileBuffer
				.toString()
				.split('\\r')
				.join('\r'),
		) as ConfigMap;
	}

	async updateMany(envvars: ConfigMap) {
		const conf = await this.list();

		for (const name of keys(envvars)) {
			conf[name] = envvars[name];
		}
		await this.writeEnvFile(conf);
		return conf;
	}

	private async writeEnvFile(config: ConfigMap) {
		let dotenvString = '';
		for (const name of keys(config)) {
			const entry = `${name}="${config[name]}"\n`;
			dotenvString += entry;
		}
		// @ts-ignore
		return writeFileAsync(this.access.path, dotenvString);
	}
}
