/*
Copyright 2019 Balena Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import { parse } from 'dotenv';
import * as _ from 'lodash';
import * as fs from 'mz/fs';

import { ConfigStoreAdapterError } from '../../../error-types';
import {
	configMapToPairs,
	kvPairsToConfigMap,
	readFromUri,
} from '../../../tools';
import { ConfigStoreAccess, EnvConfigStoreAccess } from '../../environment';

import { ConfigMap, ConfigStore } from '../config-store';

/**
 * EnvConfigStoreAdapter class
 * Used for interacting with envFile config stores
 */
export class EnvConfigStore implements ConfigStore {
	private readonly access: EnvConfigStoreAccess;

	/**
	 * EnvConfigStoreAdapter constructor
	 * @param {ConfigStoreAccess} access
	 */
	public constructor(access: ConfigStoreAccess) {
		if (!access.envFile) {
			throw new ConfigStoreAdapterError('envFile not specified');
		}

		this.access = {
			path: access.envFile.path,
		};
	}

	/**
	 * Lists raw envvar pairs
	 * @returns {Promise<ConfigMap>}
	 */
	public async listPairs(): Promise<ConfigMap> {
		const envFileBuffer = await readFromUri({
			uri: this.access.path,
			path: '',
		});
		return parse(
			envFileBuffer
				.toString()
				.split('\\r')
				.join('\r'),
		);
	}

	/**
	 * Returns Env ConfigStore ConfigMap
	 * @returns {Promise<ConfigMap>}
	 */
	public async list(): Promise<ConfigMap> {
		return kvPairsToConfigMap(await this.listPairs());
	}

	/**
	 * Updates ConfigStore with envvars ConfigMap
	 * @param {ConfigMap} envvars
	 * @returns {Promise<ConfigMap>}
	 */
	async updateMany(envvars: ConfigMap): Promise<ConfigMap> {
		const envvarPairs = configMapToPairs(envvars);
		const conf = await this.listPairs();

		for (const name in envvarPairs) {
			conf[name] = envvarPairs[name];
		}
		await this.writeEnvFile(conf);
		return await this.list();
	}

	/**
	 * Writes ConfigMap to Environment File
	 * @param {ConfigMap} config
	 * @returns {Promise<void>}
	 */
	private writeEnvFile(config: ConfigMap): Promise<void> {
		let dotenvString = '';
		for (const name in config) {
			dotenvString += `${name}="${config[name]}"\n`;
		}

		return fs.writeFile(this.access.path, dotenvString);
	}
}
