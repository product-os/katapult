import { promisify } from 'bluebird';
import { readFile } from 'fs';
import { Client1_13, config } from 'kubernetes-client';
import { filter, get, keys } from 'lodash';
import * as tunnel from 'tunnel-ssh';
import { runInTunnel } from '../../../tools';
import { ConfigStoreAccess } from '../../environment-file';
import { ConfigMap } from '../index';
import { ApiClient } from './kubernetes-client-types-extended';

const readFileAsync = promisify(readFile);

export class KubernetesConfigStoreAdapter {
	public static async create(access: ConfigStoreAccess) {
		const kubeConfig = config.fromKubeconfig(
			get(access.kubernetes, 'kubeConfigPath', './kube/config'),
		);
		const client = new Client1_13({ config: kubeConfig });

		let tnlConfig: tunnel.Config | null = null;
		if (get(access.kubernetes, ['bastion', 'host'])) {
			const privateKey = await readFileAsync(
				get(access.kubernetes, ['bastion', 'key']),
			);
			tnlConfig = {
				username: get(access.kubernetes, ['bastion', 'username']),
				host: get(access.kubernetes, ['bastion', 'host']),
				dstHost: get(access.kubernetes, 'endpoint', 'kubernetes'),
				port: parseInt(get(access.kubernetes, ['bastion', 'port'], 22), 10),
				dstPort: 443,
				privateKey: privateKey.toString(),
				localHost: '127.0.0.1',
				localPort: 8443,
				passphrase: get(access.kubernetes, ['bastion', 'keyPassword']),
			} as tunnel.Config;
		}
		return new KubernetesConfigStoreAdapter(access, client, tnlConfig);
	}

	readonly access: ConfigStoreAccess;
	readonly tnlConfig: tunnel.Config | null;
	private client: ApiClient;

	public constructor(
		access: ConfigStoreAccess,
		client: any,
		tnlConfig: tunnel.Config | null,
	) {
		this.access = access;
		this.tnlConfig = tnlConfig;
		this.client = client;
	}

	async list(): Promise<ConfigMap> {
		if (get(this.access.kubernetes, 'bastion')) {
			return (await runInTunnel(
				this.tnlConfig,
				this.listSecretsVars(),
				300000,
			)) as ConfigMap;
		}
		return await this.listSecretsVars();
	}

	async listSecretsVars(): Promise<ConfigMap> {
		await this.client.loadSpec();
		const secrets = await this.client.api.v1
			.namespaces(get(this.access.kubernetes, 'namespace'))
			.secrets.get();
		const ret = {} as ConfigMap;
		for (const secret of secrets.body.items) {
			if (secret.type === 'Opaque') {
				for (const name of keys(secret.data)) {
					if (secret.data[name] === null) {
						ret[name] = '';
					} else {
						ret[name] = Buffer.from(secret.data[name], 'base64').toString();
					}
				}
			}
		}
		return ret;
	}

	async patchSecret(k8sSecretName: string, name: string, value: string) {
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
		try {
			await this.client.api.v1
				.namespaces(get(this.access.kubernetes, 'namespace'))
				.secrets(k8sSecretName)
				.patch({ body: patchManifest });
			return true;
		} catch (err) {
			throw new Error(`Error updating secret ${name}`);
		}
	}

	async putSecret(k8sSecretName: string, name: string, value: string) {
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
		try {
			await this.client.api.v1
				.namespaces(get(this.access.kubernetes, 'namespace'))
				.secrets.post({ body: postManifest });
			return true;
		} catch (err) {
			throw new Error(`Error setting secret ${name}`);
		}
	}

	async updateMany(envvars: ConfigMap): Promise<ConfigMap> {
		if (get(this.access.kubernetes, 'bastion')) {
			return (await runInTunnel(
				this.tnlConfig,
				this.updateSecretsConfigMap(envvars),
				300000,
			)) as ConfigMap;
		}
		return await this.updateSecretsConfigMap(envvars);
	}

	/**
	 *
	 * @param {string} name
	 * @param {string} value
	 * @param secrets
	 * @returns {Promise<boolean>} True if secret exists
	 */
	async updateExistingSecret(name: string, value: string, secrets?: any) {
		if (!secrets) {
			secrets = this.getOpaqueSecrets();
		}

		for (const secret of secrets) {
			for (const envvarName of keys(secret.data)) {
				if (
					envvarName === name &&
					value.toString() !==
						Buffer.from(secret.data[envvarName], 'base64').toString()
				) {
					await this.patchSecret(secret.metadata.name, envvarName, value);
					return true;
				}
				if (envvarName === name) {
					return true;
				}
			}
		}
		return false;
	}

	async updateSecret(name: string, value: string, secrets?: any) {
		if (!secrets) {
			secrets = this.getOpaqueSecrets();
		}
		const exists = await this.updateExistingSecret(name, value, secrets);
		if (!exists) {
			const k8sSecretName = name.toLowerCase().replace(/_/g, '-');
			await this.putSecret(k8sSecretName, name, value);
		}
		return true;
	}

	async getOpaqueSecrets() {
		const secrets = await this.client.api.v1
			.namespaces(get(this.access.kubernetes, 'namespace'))
			.secrets.get();
		return filter(secrets.body.items, { type: 'Opaque' });
	}

	async updateSecretsConfigMap(envvars: ConfigMap) {
		const secrets = await this.getOpaqueSecrets();
		for (const name of keys(envvars)) {
			await this.updateSecret(name, get(envvars, name).toString(), secrets);
		}
		return await this.listSecretsVars();
	}
}
