import { Dictionary } from 'lodash';
import * as process from 'process';

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

/**
 * Base class that imports process.env
 * The values from process.env have the highest priority
 * and will overwrite settings from config stores.
 */
export abstract class BaseConfigStore implements ConfigStore {
	constructor() {}

	protected abstract read_list(): Promise<ConfigMap>;

	private async readProcessEnvironment(): Promise<ConfigMap> {
		return process.env;
	}

	public async list(): Promise<ConfigMap> {
		const processEnvMap = await this.readProcessEnvironment();
		const storeMap = await this.read_list();

		return {
			...storeMap,
			...processEnvMap,
		};
	}

	abstract updateMany(config: ConfigMap): Promise<ConfigMap>;
}
