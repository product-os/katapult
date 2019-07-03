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
import {
	ApiClient as ApiClientBase,
	Client1_13 as Client,
	config,
} from 'kubernetes-client';

import * as _ from 'lodash';
import * as fs from 'mz/fs';
import * as tunnel from 'tunnel-ssh';

import {
	configMapToPairs,
	kvPairsToConfigMap,
	runInTunnel,
} from '../../../tools';
import { ConfigStoreAccess } from '../../environment';

import { ConfigMap, ConfigStore } from '../config-store';

interface ApiVersion {
	v1: any;
}

export interface ApiClient extends ApiClientBase {
	api: ApiVersion;
	loadSpec(): any;
}

interface SecretOperationArgs {
	k8sSecretName: string;
	name: string;
	value: string;
}

interface UpdateSecretArgs {
	name: string;
	value: string;
	secrets?: any;
}

/**
 * KubernetesConfigStoreAdapter class
 * Used for interacting with kubernetes config stores
 */
export class KubernetesConfigStore implements ConfigStore {
	public static async create(access: ConfigStoreAccess) {
		const kubeConfig = config.fromKubeconfig(
			_.get(access.kubernetes, 'kubeConfigPath', './kube/config'),
		);
		const client = new Client({ config: kubeConfig });
		let tnlConfig: tunnel.Config | null = null;
		if (_.get(access.kubernetes, ['bastion', 'host'])) {
			const privateKey = await fs.readFile(
				_.get(access.kubernetes, ['bastion', 'key']),
			);
			tnlConfig = {
				username: _.get(access.kubernetes, ['bastion', 'username']),
				host: _.get(access.kubernetes, ['bastion', 'host']),
				dstHost: _.get(access.kubernetes, 'endpoint', 'kubernetes'),
				port: parseInt(_.get(access.kubernetes, ['bastion', 'port'], 22), 10),
				dstPort: 443,
				privateKey: privateKey.toString(),
				localHost: '127.0.0.1',
				localPort: 8443,
				passphrase: _.get(access.kubernetes, ['bastion', 'keyPassword']),
			};
		}
		return new KubernetesConfigStore(access, client, tnlConfig);
	}

	readonly access: ConfigStoreAccess;
	readonly tnlConfig: tunnel.Config | null;
	private client: ApiClient;

	/**
	 * KubernetesConfigStoreAdapter constructor
	 * @param {ConfigStoreAccess} access
	 * @param client
	 * @param {tunnel.Config | null} tnlConfig
	 */
	public constructor(
		access: ConfigStoreAccess,
		client: any,
		tnlConfig: tunnel.Config | null,
	) {
		this.access = access;
		this.tnlConfig = tnlConfig;
		this.client = client;
	}

	/**
	 * Returns kubernetes ConfigStore ConfigMap
	 * @returns {Promise<ConfigMap>}
	 */
	async list(): Promise<ConfigMap> {
		if (_.get(this.access.kubernetes, 'bastion') && this.tnlConfig) {
			return await runInTunnel(this.tnlConfig, this.listSecretsVars(), 300000);
		}
		return await this.listSecretsVars();
	}

	/**
	 * Lists raw secrets pairs
	 * @returns {Promise<ConfigMap>}
	 */
	async listSecretsVars(): Promise<ConfigMap> {
		await this.client.loadSpec();
		const secrets = await this.client.api.v1
			.namespaces(_.get(this.access.kubernetes, 'namespace'))
			.secrets.get();
		const ret: ConfigMap = {};
		for (const secret of secrets.body.items) {
			if (secret.type === 'Opaque') {
				for (const name of _.keys(secret.data)) {
					ret[name] =
						secret.data[name] == null
							? ''
							: Buffer.from(secret.data[name], 'base64').toString();
				}
			}
		}
		return kvPairsToConfigMap(ret);
	}

	/**
	 * Patch a k8s secret in ConfigStore
	 * @param {string} k8sSecretName
	 * @param {string} name
	 * @param {string} value
	 * @returns {Promise<void>}
	 */
	async patchSecret({
		k8sSecretName,
		name,
		value,
	}: SecretOperationArgs): Promise<void> {
		const patchManifest = {
			APIVersion: 'v1',
			Kind: 'Secret',
			metadata: {
				name: k8sSecretName,
			},
			type: 'Opaque',
			data: {
				[name]: Buffer.from(value).toString('base64'),
			},
		};
		await this.client.api.v1
			.namespaces(_.get(this.access.kubernetes, 'namespace'))
			.secrets(k8sSecretName)
			.patch({ body: patchManifest });
	}

	/**
	 * Put a k8s secret to ConfigStore
	 * @param {string} k8sSecretName
	 * @param {string} name
	 * @param {string} value
	 * @returns {Promise<void>}
	 */
	async putSecret({
		k8sSecretName,
		name,
		value,
	}: SecretOperationArgs): Promise<void> {
		const postManifest = {
			APIVersion: 'v1',
			Kind: 'Secret',
			metadata: {
				name: k8sSecretName,
			},
			type: 'Opaque',
			data: {
				[name]: Buffer.from(value).toString('base64'),
			},
		};
		await this.client.api.v1
			.namespaces(_.get(this.access.kubernetes, 'namespace'))
			.secrets.post({ body: postManifest });
	}

	/**
	 * Updates ConfigStore with envvars ConfigMap
	 * @param {ConfigMap} envvars
	 * @returns {Promise<ConfigMap>}
	 */
	async updateMany(envvars: ConfigMap): Promise<ConfigMap> {
		if (_.get(this.access.kubernetes, 'bastion') && this.tnlConfig) {
			return await runInTunnel(
				this.tnlConfig,
				this.updateSecretsConfigMap(envvars),
				300000,
			);
		}
		return await this.updateSecretsConfigMap(envvars);
	}

	/**
	 * Updates a secret if exists
	 * @param {string} name
	 * @param {string} value
	 * @param secrets
	 * @returns {Promise<boolean>} True if secret exists, otherwise False
	 */
	async updateExistingSecret({
		name,
		value,
		secrets,
	}: UpdateSecretArgs): Promise<boolean> {
		if (!secrets) {
			secrets = this.getOpaqueSecrets();
		}

		for (const secret of secrets) {
			const secretValue = _.get(secret.data, name);
			if (secretValue) {
				if (
					value.toString() !== Buffer.from(secretValue, 'base64').toString()
				) {
					await this.patchSecret({
						k8sSecretName: secret.metadata.name,
						name,
						value,
					});
				}
				return true;
			}
		}
		return false;
	}

	/**
	 * Updates a secret
	 * @param {string} name
	 * @param {string} value
	 * @param {any} secrets
	 * @returns {Promise<void>}
	 */
	async updateSecret({
		name,
		value,
		secrets,
	}: UpdateSecretArgs): Promise<void> {
		if (!secrets) {
			secrets = this.getOpaqueSecrets();
		}
		if (!(await this.updateExistingSecret({ name, value, secrets }))) {
			const k8sSecretName = name.toLowerCase().replace(/_/g, '-');
			await this.putSecret({ k8sSecretName, name, value });
		}
	}

	/**
	 * Gets Opaque secrets
	 * @returns {Promise<any>}
	 */
	async getOpaqueSecrets(): Promise<any> {
		const secrets = await this.client.api.v1
			.namespaces(_.get(this.access.kubernetes, 'namespace'))
			.secrets.get();
		return _.filter(secrets.body.items, { type: 'Opaque' });
	}

	/**
	 * Updates config-store secrets of envvars ConfigMap
	 * @param {ConfigMap} envvars
	 * @returns {Promise<ConfigMap>}
	 */
	async updateSecretsConfigMap(envvars: ConfigMap): Promise<ConfigMap> {
		const secrets = await this.getOpaqueSecrets();
		const envvarPairs = configMapToPairs(envvars);
		for (const name of _.keys(envvarPairs)) {
			await this.updateSecret({
				name,
				value: envvarPairs[name].toString(),
				secrets,
			});
		}
		return await this.listSecretsVars();
	}
}
