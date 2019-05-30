import { get } from 'lodash';
import { ConfigStoreAccess } from '../environment-file';
import { EnvConfigStoreAdapter } from './adapters/env-config-store';
import { KubernetesConfigStoreAdapter } from './adapters/kubernetes-config-store';
import { ConfigMap } from './index';

export class ConfigStore {
	public static async create(access: ConfigStoreAccess): Promise<ConfigStore> {
		let adapter: EnvConfigStoreAdapter | KubernetesConfigStoreAdapter;

		if (get(access, 'kubernetes')) {
			adapter = await KubernetesConfigStoreAdapter.create(access);
		} else if (get(access, 'envFile')) {
			adapter = new EnvConfigStoreAdapter(access);
		} else {
			throw new Error('Not implemented');
		}
		return new ConfigStore(access, adapter);
	}

	private readonly access: ConfigStoreAccess;
	private readonly adapter:
		| EnvConfigStoreAdapter
		| KubernetesConfigStoreAdapter;

	public constructor(
		access: ConfigStoreAccess,
		adapter: EnvConfigStoreAdapter | KubernetesConfigStoreAdapter,
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
	async updateMany(config: ConfigMap) {
		return this.adapter.updateMany(config);
	}
}
