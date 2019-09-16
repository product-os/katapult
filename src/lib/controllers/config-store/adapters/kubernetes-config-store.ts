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
import * as _ from 'lodash';

import * as kubernetes from '../../../kubernetes';
import { configMapToPairs, kvPairsToConfigMap } from '../../../tools';
import { ConfigStoreAccess } from '../';
import { ConfigMap, ConfigStore } from '../config-store';
import { fs } from 'mz';
import temp = require('temp');
import { PathLike } from 'fs';

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
		if (access.kubernetes === undefined) {
			throw new Error("This isn't a Kubernetes access config");
		}

		const kubeConfigStoreAccess: kubernetes.AccessConfig = {
			kubeconfig: access.kubernetes.kubeconfig,
			namespace: access.kubernetes.namespace,
			bastion: undefined,
		};

		if (access.kubernetes.bastion !== undefined) {
			kubeConfigStoreAccess.bastion = {
				apiHost: access.kubernetes.bastion.apiHost,
				apiPort: access.kubernetes.bastion.apiPort || 443,
				sshHost: access.kubernetes.bastion.host,
				sshPort: access.kubernetes.bastion.port || 22,
				sshUser: access.kubernetes.bastion.username,
				sshKey: Buffer.from(access.kubernetes.bastion.key, 'base64'),
				sshKeyPassphrase: access.kubernetes.bastion.keyPassphrase,
			};
		}

		return new KubernetesConfigStore(kubeConfigStoreAccess);
	}

	constructor(public readonly accessConfig: kubernetes.AccessConfig) {}

	/**
	 * Returns kubernetes ConfigStore ConfigMap
	 * @returns {Promise<ConfigMap>}
	 */
	async list(): Promise<ConfigMap> {
		return await this.listSecretsVars();
	}

	/**
	 * Updates ConfigStore with envvars ConfigMap
	 * @param {ConfigMap} envvars
	 * @returns {Promise<ConfigMap>}
	 */
	async updateMany(envvars: ConfigMap): Promise<ConfigMap> {
		return await this.updateSecretsConfigMap(envvars);
	}

	/**
	 * Lists raw secrets pairs
	 * @returns {Promise<ConfigMap>}
	 */
	private async listSecretsVars(): Promise<ConfigMap> {
		const access = await kubernetes.getKubernetesAccess(this.accessConfig);
		return await access.begin(async function(client) {
			const secrets = await client.api.v1
				.namespaces(this.accessConfig.namespace)
				.secrets.get();
			const ret: ConfigMap = {};
			for (const secret of secrets.body.items) {
				if (secret.type === 'Opaque') {
					for (const name in secret.data) {
						ret[name] =
							secret.data[name] == null
								? ''
								: Buffer.from(secret.data[name], 'base64').toString();
					}
				}
			}
			return kvPairsToConfigMap(ret);
		});
	}

	// /**
	//  * Patch a k8s secret in ConfigStore
	//  * @param {string} k8sSecretName
	//  * @param {string} name
	//  * @param {string} value
	//  * @returns {Promise<void>}
	//  */
	private async patchSecret(
		client: any,
		{ k8sSecretName, name, value }: SecretOperationArgs,
	): Promise<void> {
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
		await client.api.v1
			.namespaces(this.accessConfig.namespace)
			.secrets(k8sSecretName)
			.patch({ body: patchManifest });
	}

	// /**
	//  * Put a k8s secret to ConfigStore
	//  * @param {string} k8sSecretName
	//  * @param {string} name
	//  * @param {string} value
	//  * @returns {Promise<void>}
	//  */
	private async putSecret(
		client: any,
		{ k8sSecretName, name, value }: SecretOperationArgs,
	): Promise<void> {
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
		await client.api.v1
			.namespaces(this.accessConfig.namespace)
			.secrets.post({ body: postManifest });
	}

	// /**
	//  * Updates a secret if exists
	//  * @param {string} name
	//  * @param {string} value
	//  * @param secrets
	//  * @returns {Promise<boolean>} True if secret exists, otherwise False
	//  */
	private async updateExistingSecret(
		client: any,
		{ name, value, secrets = this.getOpaqueSecrets(client) }: UpdateSecretArgs,
	): Promise<boolean> {
		for (const secret of secrets) {
			const secretValue = _.get(secret.data, name);
			if (secretValue) {
				if (value !== Buffer.from(secretValue, 'base64').toString()) {
					await this.patchSecret(client, {
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

	// /**
	//  * Updates a secret
	//  * @param {string} name
	//  * @param {string} value
	//  * @param {any} secrets
	//  * @returns {Promise<void>}
	//  */
	private async updateSecret(
		client: any,
		{ name, value, secrets }: UpdateSecretArgs,
	): Promise<void> {
		if (!secrets) {
			secrets = this.getOpaqueSecrets(client);
		}
		if (!(await this.updateExistingSecret(client, { name, value, secrets }))) {
			const k8sSecretName = name.toLowerCase().replace(/_/g, '-');
			await this.putSecret(client, { k8sSecretName, name, value });
		}
	}

	// /**
	//  * Gets Opaque secrets
	//  * @returns {Promise<any>}
	//  */
	private async getOpaqueSecrets(client: any): Promise<any> {
		const secrets = await client.api.v1
			.namespaces(this.accessConfig.namespace)
			.secrets.get();
		return _.filter(secrets.body.items, { type: 'Opaque' });
	}

	private async updateSecretsConfigMap(envvars: ConfigMap): Promise<ConfigMap> {
		const self = this;
		const access = await kubernetes.getKubernetesAccess(this.accessConfig);

		return await access.begin(async function(client) {
			const opaqueSecretsResponse = await client.api.v1
				.namespaces(this.accessConfig.namespace)
				.secrets.get();

			const opaqueSecrets = _.filter(opaqueSecretsResponse.body.items, {
				type: 'Opaque',
			});

			const envvarPairs = configMapToPairs(envvars);
			for (const name in envvarPairs) {
				await self.updateSecret(client, {
					name,
					value: envvarPairs[name].toString(),
					secrets: opaqueSecrets,
				});
			}
			return await self.listSecretsVars();
		});
	}
}
