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
import { ConfigStoreAccess } from '../environment';
import { EnvConfigStore } from './adapters/env-config-store';
import { KubernetesConfigStore } from './adapters/kubernetes-config-store';
import { YamlConfigStore } from './adapters/yaml-config-store';

export interface ConfigMap {
	[key: string]: any;
}

export interface ConfigStore {
	/**
	 * List the key-value configuration variables.
	 * @returns {Promise<ConfigMap>}
	 */
	list(): Promise<ConfigMap>;
	/**
	 * Create or update the configMap key-value configuration variables.
	 * @param {ConfigMap} config: [key: string]: string
	 * @returns {Promise<ConfigMap>}
	 */
	updateMany(config: ConfigMap): Promise<ConfigMap>;
}

/**
 * Create ConfigStore using:
 * @param {ConfigStoreAccess} access
 * @returns {Promise<ConfigStore>}
 */
export async function createConfigStore(
	access: ConfigStoreAccess,
): Promise<ConfigStore> {
	if (access.kubernetes) {
		return await KubernetesConfigStore.create(access);
	}
	if (access.envFile) {
		return new EnvConfigStore(access);
	}
	if (access.yamlFile) {
		return new YamlConfigStore(access);
	}
	throw new Error('Not implemented');
}
