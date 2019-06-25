import { promisify } from 'bluebird';
import { readFile } from 'fs';
import { Client1_13 as Client, config } from 'kubernetes-client';
import * as _ from 'lodash';
import * as tunnel from 'tunnel-ssh';
import {
	configMapToPairs,
	kvPairsToConfigMap,
	runInTunnel,
} from '../../../tools';
import { ConfigStoreAccess } from '../../environment';
import { ConfigMap } from '../index';
import { ApiClient } from './kubernetes-client-types-extended';

const readFileAsync = promisify(readFile);

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

export class KubernetesConfigStoreAdapter {
	public static async create(access: ConfigStoreAccess) {
		const kubeConfig = config.fromKubeconfig(
			_.get(access.kubernetes, 'kubeConfigPath', './kube/config'),
		);
		const client = new Client({ config: kubeConfig });

		let tnlConfig: tunnel.Config | null = null;
		if (_.get(access.kubernetes, ['bastion', 'host'])) {
			const privateKey = await readFileAsync(
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
		if (_.get(this.access.kubernetes, 'bastion')) {
			return await runInTunnel(this.tnlConfig, this.listSecretsVars(), 300000);
		}
		return await this.listSecretsVars();
	}

	async listSecretsVars(): Promise<ConfigMap> {
		await this.client.loadSpec();
		const secrets = await this.client.api.v1
			.namespaces(_.get(this.access.kubernetes, 'namespace'))
			.secrets.get();
		const ret: ConfigMap = {};
		for (const secret of secrets.body.items) {
			if (secret.type === 'Opaque') {
				for (const name of _.keys(secret.data)) {
					if (secret.data[name] === null) {
						ret[name] = '';
					} else {
						ret[name] = Buffer.from(secret.data[name], 'base64').toString();
					}
				}
			}
		}
		return kvPairsToConfigMap(ret);
	}

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

	async updateMany(envvars: ConfigMap): Promise<ConfigMap> {
		if (_.get(this.access.kubernetes, 'bastion')) {
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
	async updateExistingSecret({
		name,
		value,
		secrets,
	}: UpdateSecretArgs): Promise<boolean> {
		if (!secrets) {
			secrets = this.getOpaqueSecrets();
		}

		for (const secret of secrets) {
			for (const envvarName of _.keys(secret.data)) {
				if (
					envvarName === name &&
					value.toString() !==
						Buffer.from(secret.data[envvarName], 'base64').toString()
				) {
					await this.patchSecret({
						k8sSecretName: secret.metadata.name,
						name: envvarName,
						value,
					});
					return true;
				}
				if (envvarName === name) {
					return true;
				}
			}
		}
		return false;
	}

	async updateSecret({
		name,
		value,
		secrets,
	}: UpdateSecretArgs): Promise<void> {
		if (!secrets) {
			secrets = this.getOpaqueSecrets();
		}
		const exists = await this.updateExistingSecret({ name, value, secrets });
		if (!exists) {
			const k8sSecretName = name.toLowerCase().replace(/_/g, '-');
			await this.putSecret({ k8sSecretName, name, value });
		}
	}

	async getOpaqueSecrets(): Promise<any> {
		const secrets = await this.client.api.v1
			.namespaces(_.get(this.access.kubernetes, 'namespace'))
			.secrets.get();
		return _.filter(secrets.body.items, { type: 'Opaque' });
	}

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
