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
import { Dictionary } from 'lodash';
import { ConfigStoreAccess } from './';
import { EnvConfigStore } from './adapters/env-config-store';
import { KubernetesConfigStore } from './adapters/kubernetes-config-store';
import { YamlConfigStore } from './adapters/yaml-config-store';
import * as _ from 'lodash';

export type ConfigMap = Dictionary<any>;

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

export class CompoundConfigStore implements ConfigStore {
	constructor(public stores: ConfigStore[] = []) {}

	appendStore = (store: ConfigStore) => {
		this.stores.push(store);
	};

	list = (): Promise<ConfigMap> =>
		Promise.all(this.stores.map(s => s.list())).then(maps =>
			_.assign({}, ...maps),
		);

	updateMany = (config: ConfigMap): Promise<ConfigMap> =>
		Promise.all(
			this.stores.map(s =>
				s
					.list()
					.then(existingMap => _.pickBy(config, k => existingMap[k] != null))
					.then(filteredMap => s.updateMany(filteredMap)),
			),
		).then(updatedMaps => _.assign({}, ...updatedMaps));
}

export class ProcessEnvironmentConfigStore implements ConfigStore {
	list = (): Promise<Dictionary<any>> => Promise.resolve(process.env);
	updateMany = (config: Dictionary<any>): Promise<Dictionary<any>> =>
		Promise.resolve(config);
}

/**
 * Create ConfigStore using:
 * @param {ConfigStoreAccess} access
 * @returns {Promise<ConfigStore>}
 */
export async function createConfigStore(
	access: ConfigStoreAccess,
): Promise<ConfigStore> {
	const processEnvConfigStore = new ProcessEnvironmentConfigStore();
	const compoundConfigStore = new CompoundConfigStore([processEnvConfigStore]);

	if (access.kubernetes) {
		compoundConfigStore.appendStore(await KubernetesConfigStore.create(access));
	}
	if (access.envFile) {
		compoundConfigStore.appendStore(new EnvConfigStore(access));
	}
	if (access.yamlFile) {
		compoundConfigStore.appendStore(new YamlConfigStore(access));
	}

	return compoundConfigStore;
}
