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
import { get } from 'lodash';
import { ConfigStoreAccess } from '../environment';
import { EnvConfigStoreAdapter } from './adapters/env-config-store';
import { KubernetesConfigStoreAdapter } from './adapters/kubernetes-config-store';
import { YamlConfigStoreAdapter } from './adapters/yaml-config-store';
import { ConfigMap } from './index';

/**
 * ConfigStore class
 * Used for interacting with config-stores of supported types.
 */
export class ConfigStore {
	/**
	 * Create ConfigStore using:
	 * @param {ConfigStoreAccess} access
	 * @returns {Promise<ConfigStore>}
	 */
	public static async create(access: ConfigStoreAccess): Promise<ConfigStore> {
		let adapter:
			| EnvConfigStoreAdapter
			| KubernetesConfigStoreAdapter
			| YamlConfigStoreAdapter;
		if (get(access, 'kubernetes')) {
			adapter = await KubernetesConfigStoreAdapter.create(access);
		} else if (get(access, 'envFile')) {
			adapter = new EnvConfigStoreAdapter(access);
		} else if (get(access, 'yamlFile')) {
			adapter = new YamlConfigStoreAdapter(access);
		} else {
			throw new Error('Not implemented');
		}
		return new ConfigStore(access, adapter);
	}

	private readonly access: ConfigStoreAccess;
	private readonly adapter:
		| EnvConfigStoreAdapter
		| KubernetesConfigStoreAdapter
		| YamlConfigStoreAdapter;

	/**
	 * ConfigStore constructor
	 * @param {ConfigStoreAccess} access
	 * @param {EnvConfigStoreAdapter | KubernetesConfigStoreAdapter | YamlConfigStoreAdapter} adapter
	 */
	public constructor(
		access: ConfigStoreAccess,
		adapter:
			| EnvConfigStoreAdapter
			| KubernetesConfigStoreAdapter
			| YamlConfigStoreAdapter,
	) {
		this.access = access;
		this.adapter = adapter;
	}

	/**
	 * List the key-value configuration variables.
	 * @returns {Promise<ConfigMap>}
	 */
	async list(): Promise<ConfigMap> {
		return await this.adapter.list();
	}

	/**
	 * Create or update the configMap key-value configuration variables.
	 * @param {ConfigMap} config: [key: string]: string
	 * @returns {Promise<ConfigMap>}
	 */
	async updateMany(config: ConfigMap): Promise<ConfigMap> {
		return this.adapter.updateMany(config);
	}
}
