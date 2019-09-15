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
import * as fs from 'mz/fs';
import { safeDump } from 'js-yaml';

import { ConfigStoreAdapterError } from '../../../error-types';
import { loadFromFile } from '../../../tools';
import { ConfigStoreAccess, YamlConfigStoreAccess } from '../../environment';

import { ConfigMap, ConfigStore } from '../config-store';

/**
 * YamlConfigStoreAdapter class
 * Used for interacting with yaml config-stores
 */
export class YamlConfigStore implements ConfigStore {
	private readonly access: YamlConfigStoreAccess;

	/**
	 * YamlConfigStoreAdapter constructor
	 * @param {ConfigStoreAccess} access
	 */
	public constructor(access: ConfigStoreAccess) {
		if (!access.yamlFile) {
			throw new ConfigStoreAdapterError('yamlFile not specified');
		}

		this.access = {
			path: access.yamlFile.path || 'environment.yml',
		};
	}

	/**
	 * Returns Yaml ConfigStore ConfigMap
	 * @returns {Promise<ConfigMap>}
	 */
	async list(): Promise<ConfigMap> {
		try {
			return await loadFromFile(this.access.path);
		} catch (e) {
			if (e.code === 'ENOENT') {
				return {};
			}
			throw e;
		}
	}

	/**
	 * Updates yaml file config store by replacement
	 * @param {ConfigMap} changes
	 * @returns {Promise<ConfigMap>}
	 */
	async updateMany(changes: ConfigMap): Promise<ConfigMap> {
		await this.write(changes);
		return changes;
	}

	/**
	 * Writes yaml config-store file
	 * @param {ConfigMap} config
	 */
	private async write(config: ConfigMap) {
		return await fs.writeFile(this.access.path, safeDump(config));
	}
}
