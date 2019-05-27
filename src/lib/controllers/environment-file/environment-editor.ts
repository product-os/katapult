import inquirer = require('inquirer');

import { filter, get, isEmpty, merge, omit } from 'lodash';
import { join } from 'path';

import {
	Bastion,
	ConfigStoreAccess,
	DeployTargetAccess,
	DeployTargetSelections,
	Environment,
	EnvironmentEditorArgs,
} from '.';

import { getDirectories, loadFromFile, writeYaml } from '../../tools';

import {
	inquirerValidateDirectory,
	inquirerValidateFilePath,
	inquirerValidateFQDN,
	inquirerValidatePath,
	inquirerValidatePort,
	inquirerValidateString,
} from '../../validators';

const configStoreSelections = [
	{ name: 'Kubernetes (secrets in namespace)', value: 'kubernetes' },
	{ name: 'Local environment file', value: 'envFile' },
];

const deployTargets = [
	{ name: 'Kubernetes', value: 'kubernetes' },
	{ name: 'Docker Socket', value: 'compose' },
	{ name: 'Balena Cloud', value: 'balena' },
];

const defaultEnvironment = {
	name: 'my-environment',
	productRepo: './',
	archiveStore: './archive-store',
	encryptionKeyPath: './encryption_key_pub',
	deployTarget: {
		kubernetes: {
			namespace: 'default',
			endpoint: 'kubernetes.local',
			kubeConfigPath: './kubeconfig',
			bastion: {
				host: 'bastion.example.com',
				port: '22',
				localPort: '8443',
				username: 'admin',
				key: 'bastion_key',
				keyPassword: 'bastionKeyPassword',
			},
		},
		compose: {
			socket: '/var/run/docker.sock', // TODO: support generic socket URI
		},
	},
	configStore: {
		kubernetes: {
			namespace: 'default',
			endpoint: 'kubernetes.local',
			kubeConfigPath: './kubeconfigl',
			bastion: {
				host: 'bastion.example.com',
				port: '22',
				localPort: '8443',
				username: 'admin',
				key: 'bastion_key',
				keyPassword: 'bastionKeyPassword',
			},
		},
	},
} as Environment;

export class EnvironmentEditor {
	static async createEnvironmentEditor(
		args: EnvironmentEditorArgs,
	): Promise<EnvironmentEditor> {
		const { configurationPath } = args;
		let environment = {} as Environment;

		if (!args.environment && configurationPath) {
			try {
				environment = (await loadFromFile(configurationPath)) as Environment;
			} catch (err) {
				if (err.code !== 'ENOENT') {
					throw err;
				}
			}
			if (!isEmpty(environment)) {
				args.environment = environment;
			} else {
				args.environment = defaultEnvironment;
			}
		}
		return new EnvironmentEditor(args);
	}

	static async initializeEnvironment(args: EnvironmentEditorArgs) {
		const editor = await EnvironmentEditor.createEnvironmentEditor(args);
		await editor.inquire();
		await editor.save();
		return true;
	}

	private static filterPromptAnswers(answers: object): object {
		const intermediatePromptKeys = [
			'getBastion',
			'configStoreType',
			'deployTargetType',
		];

		return omit(answers, intermediatePromptKeys);
	}

	private static async getDeployTargetSelections(
		productRepoPath: string,
	): Promise<DeployTargetSelections[]> {
		const directories = await getDirectories(join(productRepoPath, 'deploy'));
		const availableTargets = filter(deployTargets, i =>
			directories.includes(i.value),
		) as DeployTargetSelections[];

		if (availableTargets.length < 1) {
			throw new Error(
				`No available deploy targets were found in: ${productRepoPath}.` +
					`\nAt least one folder with a deploy target name should exist in ${productRepoPath}.` +
					`\nAvailable options:\n${deployTargets.map(v => v.value)}`,
			);
		}

		return availableTargets;
	}

	private static async inquireBastion(
		defaultBastion?: Bastion,
	): Promise<Bastion> {
		const questions = [
			{
				message: 'Please enter your bastion hostname',
				type: 'input',
				name: 'host',
				default: get(defaultBastion, 'host'),
				validate: inquirerValidateFQDN,
			},
			{
				message: 'Please enter your bastion port',
				type: 'input',
				name: 'port',
				default: get(defaultBastion, 'port'),
				validate: inquirerValidatePort,
			},
			{
				message: 'Please enter localhost tunnel port',
				type: 'input',
				name: 'localPort',
				default: get(defaultBastion, 'localPort'),
				validate: inquirerValidatePort,
			},
			{
				message: 'Please enter your bastion username',
				type: 'input',
				name: 'username',
				default: get(defaultBastion, 'username'),
				validate: inquirerValidateString,
			},
			{
				message: 'Please enter your bastion key path',
				type: 'input',
				name: 'key',
				default: get(defaultBastion, 'key'),
				validate: inquirerValidateFilePath,
			},
			{
				message: 'Please enter your bastion key password (if any)',
				type: 'input',
				name: 'keyPassword',
				default: get(defaultBastion, 'keyPassword'),
			},
		] as inquirer.Questions;
		const answers = await inquirer.prompt(questions);
		return answers as Bastion;
	}

	verbose: boolean;
	private environment: Environment;
	private readonly configurationPath: string;

	public constructor(args: EnvironmentEditorArgs) {
		const { configurationPath, environment, verbose = false } = args;
		this.environment = environment;
		this.configurationPath = configurationPath;
		this.verbose = verbose;
	}

	async inquire() {
		const questions = [
			{
				message: 'Please enter name of the environment',
				type: 'input',
				default: get(this.environment, 'name'),
				name: 'name',
				validate: inquirerValidateString,
			},
			{
				message:
					'Please enter the Product Repo URI. (You may also use a relative path)',
				type: 'input',
				default: get(this.environment, 'productRepo'),
				name: 'productRepo',
				validate: inquirerValidateDirectory, // TODO: support git
			},
			{
				message:
					'Please enter the archive-store URI. (You may also use a relative path)',
				type: 'input',
				default: get(this.environment, 'archiveStore'),
				name: 'archiveStore',
				validate: inquirerValidateDirectory, // TODO: support git
			},
			{
				message: 'Please enter the archive-store encryption key',
				type: 'input',
				name: 'encryptionKeyPath',
				default: get(this.environment, 'encryptionKeyPath'),
				validate: inquirerValidateFilePath, // TODO: improve validation of key
			},
		] as inquirer.Questions;

		const answers = await inquirer.prompt(questions);

		const availableTargets = await EnvironmentEditor.getDeployTargetSelections(
			get(answers, 'productRepo'),
		);

		const deployTarget = await this.inquireDeployTarget(
			get(this.environment, 'deployTarget'),
			availableTargets,
		);

		const configStore = await this.inquireConfigStore(
			get(this.environment, 'configStore'),
		);

		this.environment = merge(answers, {
			configStore,
			deployTarget,
		}) as Environment;

		return this.environment;
	}

	async inquireConfigStore(
		defaultConfigStore: ConfigStoreAccess,
	): Promise<ConfigStoreAccess> {
		const questions = [
			{
				message: 'Please select config-store type',
				type: 'list',
				name: 'configStoreType',
				choices: configStoreSelections,
			},
			{
				when(response: object): boolean {
					return get(response, 'configStoreType') === 'kubernetes';
				},
				message: 'Is your kubernetes API publicly accessible?',
				type: 'list',
				name: 'getBastion',
				choices: [
					{ value: false, name: 'Yes', short: 'Yes' },
					{
						value: true,
						name: 'No, it is accessible via a bastion host',
						short: 'No',
					},
				],
				default: 0,
			},
			{
				when(response: object): boolean {
					return get(response, 'configStoreType') === 'kubernetes';
				},
				message: 'Please enter config-store kubernetes api endpoint',
				type: 'input',
				name: 'kubernetes.endpoint',
				default: get(defaultConfigStore, ['kubernetes', 'endpoint']),
				validate: inquirerValidateFQDN,
			},
			{
				when(response: object): boolean {
					return get(response, 'configStoreType') === 'kubernetes';
				},
				message: 'Please enter config-store kubernetes namespace',
				type: 'input',
				name: 'kubernetes.namespace',
				default: get(defaultConfigStore, ['kubernetes', 'namespace']),
				validate: inquirerValidateString,
			},
			{
				when(response: object): boolean {
					return get(response, 'configStoreType') === 'kubernetes';
				},
				message: 'Please enter config-store kubeconfig path',
				type: 'input',
				name: 'kubernetes.kubeConfigPath',
				default: get(defaultConfigStore, ['kubernetes', 'kubeConfigPath']),
				validate: inquirerValidateFilePath,
			},
			{
				when(response: object): boolean {
					return get(response, 'configStoreType') === 'envFile';
				},
				message: 'Please enter config-store envFile path',
				type: 'input',
				name: 'envFile.path',
				default: get(defaultConfigStore, ['envFile', 'path']),
				validate: inquirerValidateFilePath,
			},
		] as inquirer.Questions;

		const answers = await inquirer.prompt(questions);
		if (get(answers, 'getBastion')) {
			const bastion = await EnvironmentEditor.inquireBastion(
				get(defaultConfigStore, ['kubernetes', 'bastion']),
			);
			return merge(EnvironmentEditor.filterPromptAnswers(answers), {
				kubernetes: { bastion },
			}) as ConfigStoreAccess;
		}

		return EnvironmentEditor.filterPromptAnswers(answers) as ConfigStoreAccess;
	}

	async inquireDeployTarget(
		defaultDeployTarget: DeployTargetAccess,
		targetTypes: DeployTargetSelections[],
	): Promise<DeployTargetAccess> {
		function kubernetesDeployTarget(response: object): boolean {
			return get(response, 'deployTargetType') === 'kubernetes';
		}

		function dockerDeployTarget(response: object): boolean {
			return ['docker', 'compose'].includes(get(response, 'deployTargetType'));
		}

		const questions = [
			{
				message: 'Please select deploy-target type',
				type: 'list',
				name: 'deployTargetType',
				choices: targetTypes,
			},
			{
				when: kubernetesDeployTarget,
				message: 'Is your kubernetes API publicly accessible?',
				type: 'list',
				name: 'getBastion',
				choices: [
					{ value: false, name: 'Yes', short: 'Yes' },
					{
						value: true,
						name: 'No, it is accessible via a bastion host',
						short: 'No',
					},
				],
				default: 0,
			},
			{
				when: kubernetesDeployTarget,
				message: 'Please enter deploy-target kubernetes api endpoint',
				type: 'input',
				name: 'kubernetes.endpoint',
				default: get(defaultDeployTarget, ['kubernetes', 'endpoint']),
				validate: inquirerValidateFQDN,
			},
			{
				when: kubernetesDeployTarget,
				message: 'Please enter deploy-target kubernetes namespace',
				type: 'input',
				name: 'kubernetes.namespace',
				default: get(defaultDeployTarget, ['kubernetes', 'namespace']),
				validate: inquirerValidateString,
			},
			{
				when: kubernetesDeployTarget,
				message: 'Please enter deploy-target kubeconfig path',
				type: 'input',
				name: 'kubernetes.kubeConfigPath',
				default: get(defaultDeployTarget, ['kubernetes', 'kubeConfigPath']),
				validate: inquirerValidateFilePath,
			},
			{
				when: dockerDeployTarget,
				message: 'Please enter deploy-target docker-socket path',
				type: 'input',
				name: 'compose.socket',
				default: get(defaultDeployTarget, ['compose', 'socket']),
				validate: inquirerValidatePath,
			},
		] as inquirer.Questions;

		const answers = await inquirer.prompt(questions);
		if (get(answers, 'getBastion')) {
			const bastion = await EnvironmentEditor.inquireBastion(
				get(defaultDeployTarget, ['kubernetes', 'bastion']),
			);
			return merge(EnvironmentEditor.filterPromptAnswers(answers), {
				kubernetes: { bastion },
			}) as DeployTargetAccess;
		}

		return EnvironmentEditor.filterPromptAnswers(answers) as DeployTargetAccess;
	}

	async save(): Promise<Environment> {
		await writeYaml(this.environment, this.configurationPath);
		return this.environment;
	}
}
