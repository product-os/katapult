import {
	ApiClient as KubeApiClientBase,
	Client1_13 as KubeClient,
	config as KubeConfig,
	ApiRoot,
} from 'kubernetes-client';

import * as Bluebird from 'bluebird';
import * as jsyaml from 'js-yaml';
import * as _ from 'lodash';
import * as temp from 'temp';

import { runInTunnel } from './tools';
import { fs } from 'mz';
import { access } from 'fs';

const LOCAL_BASTION_FORWARDED_HTTPS_PORT = 16595;

const KUBE_CONFIG = 'KUBE_CONFIG';
const KUBE_NAMESPACE = 'KUBE_NAMESPACE';
const KUBE_BASTION_HOST = 'KUBE_BASTION_HOST';
const KUBE_BASTION_PORT = 'KUBE_BASTION_PORT';
const KUBE_BASTION_USER = 'KUBE_BASTION_USER';
const KUBE_BASTION_KEY = 'KUBE_BASTION_KEY';
const KUBE_BASTION_KEY_PASSPHRASE = 'KUBE_BASTION_KEY_PASSPHRASE';
const KUBE_BASTION_API_HOST = 'KUBE_BASTION_API_HOST';
const KUBE_BASTION_API_PORT = 'KUBE_BASTION_API_PORT';

const kubeConfigVar = (key: string) =>
	process.env[`KATPULT_DEPLOY_${key}`] || process.env[`KATAPULT_${key}`];

const kubeConfigVarOrDefault = (key: string, defaultValue: string = '') =>
	kubeConfigVar(key) || defaultValue;

type KubernetesClientScope = {
	accessConfig: AccessConfig;
	kubeconfig: any;
};
type KubernetesClientFn = (
	this: KubernetesClientScope,
	client: ApiRoot,
) => Promise<any>;

export type AccessConfig = {
	kubeconfig: string;
	namespace: string;
	bastion?: {
		apiHost: string;
		apiPort: number;
		sshHost: string;
		sshPort: number;
		sshUser: string;
		sshKey: Buffer;
		sshKeyPassphrase?: string;
	};
};

export const getAccessConfigFromEnvironment = async (): Promise<
	AccessConfig
> => {
	const accessConfig: AccessConfig = {
		kubeconfig: kubeConfigVarOrDefault(KUBE_CONFIG),
		namespace: kubeConfigVarOrDefault(KUBE_NAMESPACE, 'default'),
		bastion: undefined,
	};

	if (kubeConfigVarOrDefault(KUBE_BASTION_HOST) !== '') {
		accessConfig.bastion = {
			sshHost: kubeConfigVarOrDefault(KUBE_BASTION_HOST),
			sshPort: parseInt(kubeConfigVarOrDefault(KUBE_BASTION_PORT, '22'), 10),
			sshUser: kubeConfigVarOrDefault(KUBE_BASTION_USER),
			sshKey: Buffer.from(kubeConfigVarOrDefault(KUBE_BASTION_KEY), 'base64'),
			sshKeyPassphrase: kubeConfigVar(KUBE_BASTION_KEY_PASSPHRASE),
			apiHost: kubeConfigVarOrDefault(KUBE_BASTION_API_HOST),
			apiPort: parseInt(
				kubeConfigVarOrDefault(KUBE_BASTION_API_PORT, '443'),
				10,
			),
		};
	}

	return accessConfig;
};

const getKubeconfigFromPathOrContent = async (
	pathOrContent: string,
): Promise<string> => {
	try {
		if (!(await fs.exists(pathOrContent))) {
			return pathOrContent;
		}
		const kubeconfig = await fs.readFile(pathOrContent, 'utf8');
		return kubeconfig;
	} catch {
		return pathOrContent;
	}
};

export const getKubernetesAccess = async (
	accessConfig: AccessConfig | null = null,
) => {
	accessConfig =
		accessConfig === null
			? await getAccessConfigFromEnvironment()
			: accessConfig;

	return {
		begin: async (fn: KubernetesClientFn): Promise<any> => {
			const config = _.cloneDeep(accessConfig as AccessConfig);

			const kubeconfigObj = jsyaml.safeLoad(
				await getKubeconfigFromPathOrContent(config.kubeconfig),
			);

			let linkToCluster = direct(kubeconfigObj);

			if (config.bastion != undefined) {
				// setup the wrapping function for connecting through a bastion...
				linkToCluster = viaBastion(
					kubeconfigObj,
					config.bastion.sshHost,
					config.bastion.sshPort,
					config.bastion.sshUser,
					config.bastion.apiHost,
					config.bastion.apiPort,
					config.bastion.sshKey,
					config.bastion.sshKeyPassphrase,
				);
			}

			return await linkToCluster.run(async ({ kubeconfig }) => {
				const tempFiles = temp.track();
				config.kubeconfig = tempFiles.path();

				try {
					await fs.writeFile(
						config.kubeconfig,
						JSON.stringify(kubeconfig, null, 2),
					);

					const client = new KubeClient({
						config: KubeConfig.fromKubeconfig(config.kubeconfig),
					});

					const boundFn = fn.bind({ accessConfig: config, kubeconfig });

					return await boundFn(client);
				} finally {
					// tidy up
					await fs.writeFile(config.kubeconfig, '');
					await Bluebird.fromCallback(callback => tempFiles.cleanup(callback));
				}
			});
		},
	};
};
type KubernetesRunContext = (opts: { kubeconfig: any }) => Promise<any>;

type LinkToCluster = {
	run: (context: KubernetesRunContext) => Promise<any>;
};

const direct = (kubeconfig: any): LinkToCluster => {
	return {
		run: context => context({ kubeconfig }),
	};
};

const viaBastion = (
	kubeconfig: any,
	host: string,
	port: number,
	username: string,
	apiHost: string,
	apiPort: number,
	privateKey: Buffer,
	passphrase?: string,
): LinkToCluster => {
	return {
		run: async context =>
			await runInTunnel(
				{
					host,
					port,
					dstHost: apiHost,
					dstPort: apiPort,
					localPort: LOCAL_BASTION_FORWARDED_HTTPS_PORT,
					username,
					privateKey,
					passphrase,
				},
				async ({ assignedPort }) => {
					// tweak the kubernetes config to use the bastion locally exposed endpoint...
					kubeconfig.clusters[0].cluster.server = `https://localhost:${assignedPort}/`;
					kubeconfig.clusters[0].cluster['insecure-skip-tls-verify'] = true;
					delete kubeconfig.clusters[0].cluster['certificate-authority-data'];

					return await context({ kubeconfig });
				},
			),
	};
};
