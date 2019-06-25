import { promisify } from 'bluebird';
import { writeFile } from 'fs';
import { merge } from 'lodash';
import * as yaml from 'yamljs';
const writeFileAsync = promisify(writeFile);

import { loadFromFile } from '../../../tools';
import { ConfigStoreAccess, YamlConfigStoreAccess } from '../../environment';
import { ConfigMap } from '../index';

export class YamlConfigStoreAdapter {
	private readonly access: YamlConfigStoreAccess;

	public constructor(access: ConfigStoreAccess) {
		if (!access.yamlFile) {
			throw new Error('yamlFile not specified');
		}

		this.access = {
			path: access.yamlFile.path || 'environment.yml',
		} as YamlConfigStoreAccess;
	}

	async list(): Promise<ConfigMap> {
		try {
			return (await loadFromFile(this.access.path)) as ConfigMap;
		} catch (e) {
			if (e.code === 'ENOENT') {
				return {} as ConfigMap;
			}
			throw e;
		}
	}

	/**
	 * YamlConfigStoreAdapter method for updating yaml file confi store (replacement)
	 * @param {ConfigMap} changes
	 * @returns {Promise<ConfigMap>}
	 */
	async updateMany(changes: ConfigMap) {
		await this.write(changes);
		return changes;
	}

	private async write(config: ConfigMap) {
		const output = yaml.stringify(config, 4);
		// @ts-ignore
		return writeFileAsync(this.access.path, output);
	}
}
