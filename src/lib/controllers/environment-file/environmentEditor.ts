import inquirer = require('inquirer');

import { filter, get, merge, omit } from 'lodash';

import {
	Bastion,
	ConfigStore,
	DeployTarget,
	DeployTargetSelections,
	Environment,
	EnvironmentEditorArgs,
} from '.';

import { getDirectories, loadFromFileSync, writeYaml } from '../../tools';

import {
	inquirerValidateDirectory,
	inquirerValidateFQDN,
	inquirerValidatePath,
	inquirerValidatePort,
	inquirerValidateString,
} from '../../validators';

const configStoreSelections = [
	{ name: 'Kubernetes (secrets in namespace)', value: 'kubernetes' },
	{ name: 'Local environment file', value: 'envfile' },
];

export class EnvironmentEditor {
	private static async getDeployTargetSelections(
		templatesPath: string,
	): Promise<DeployTargetSelections[]> {
		const directories = await getDirectories(templatesPath);
		const availableTargets = filter(
			[
				{ name: 'Kubernetes', value: 'kubernetes' },
				{ name: 'Docker Socket', value: 'docker' },
				{ name: 'Balena Cloud', value: 'balena' },
			],
			i => directories.includes(i.value),
		) as DeployTargetSelections[];

		if (availableTargets.length < 1) {
			throw new Error(
				`No available deploy targets were found in: ${templatesPath}`,
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
				name: 'bastionHost',
				default: get(defaultBastion, 'bastionHost'),
				validate: inquirerValidateFQDN,
			},
			{
				message: 'Please enter your bastion port',
				type: 'input',
				name: 'bastionPort',
				default: get(defaultBastion, 'bastionPort'),
				validate: inquirerValidatePort,
			},
			{
				message: 'Please enter your bastion username',
				type: 'input',
				name: 'bastionUsername',
				default: get(defaultBastion, 'bastionUsername'),
				validate: inquirerValidateString,
			},
			{
				message: 'Please enter your bastion key path',
				type: 'input',
				name: 'bastionKey',
				default: get(defaultBastion, 'bastionKey'),
				validate: inquirerValidatePath,
			},
			{
				message: 'Please enter your bastion key password (if any)',
				type: 'input',
				name: 'bastionKeyPassword',
				default: get(defaultBastion, 'bastionKeyPassword'),
			},
		];
		const answers = await inquirer.prompt(questions);
		return answers as Bastion;
	}

	verbose: boolean;
	private environment: Environment;
	private readonly configurationPath: string;

	public constructor(args: EnvironmentEditorArgs) {
		const { configurationPath, verbose = false } = args;
		this.configurationPath = configurationPath;
		this.verbose = verbose;

		// A default environment for some default suggestions It might be replaced below.
		this.environment = {
			name: 'my-environment',
			templates: './deploy-templates/',
			archiveStore: './archive-store',
			deployTarget: {
				kubernetesNamespace: 'default',
				kubernetesAPI: 'kubernetes',
			},
			configStore: {
				kubernetesNamespace: 'default',
				kubernetesAPI: 'kubernetes',
			},
		};

		try {
			if (configurationPath) {
				this.environment = loadFromFileSync(configurationPath) as Environment;
			} else if (args.environment) {
				this.environment = args.environment;
			}
		} catch (err) {
			if (err.code === 'ENOENT') {
				if (this.verbose) {
					console.debug(err.message);
				}
			} else {
				throw err;
			}
		}
	}

	async inquire() {
		const questions = [
			{
				message: 'Please enter name of the environment',
				type: 'input',
				default: this.environment.name,
				name: 'name',
				validate: inquirerValidateString,
			},
			{
				message:
					'Please enter the deploy-templates URI. (You may also use a relative path)',
				type: 'input',
				default: this.environment.templates,
				name: 'templates',
				validate: inquirerValidateDirectory, // TODO: support git
			},
			{
				message:
					'Please enter the archive-store URI. (You may also use a relative path)',
				type: 'input',
				default: this.environment.archiveStore,
				name: 'archiveStore',
				validate: inquirerValidateDirectory, // TODO: support git
			},
		];

		const answers = await inquirer.prompt(questions);

		const availableTargets = await EnvironmentEditor.getDeployTargetSelections(
			get(answers, 'templates'),
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
		defaultConfigStore: ConfigStore,
	): Promise<ConfigStore> {
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
				name: 'kubernetesAPI',
				default: get(defaultConfigStore, 'kubernetesAPI'),
				validate: inquirerValidateFQDN,
			},
			{
				when(response: object): boolean {
					return get(response, 'configStoreType') === 'kubernetes';
				},
				message: 'Please enter config-store kubernetes namespace',
				type: 'input',
				name: 'kubernetesNamespace',
				default: get(defaultConfigStore, 'kubernetesNamespace'),
				validate: inquirerValidateString,
			},
			{
				when(response: object): boolean {
					return get(response, 'configStoreType') === 'envfile';
				},
				message: 'Please enter config-store envfile path',
				type: 'input',
				name: 'path',
				default: get(defaultConfigStore, 'path'),
				validate: inquirerValidatePath,
			},
		];

		const answers = await inquirer.prompt(questions);
		if (get(answers, 'getBastion')) {
			const bastion = await EnvironmentEditor.inquireBastion(
				get(defaultConfigStore, 'bastion'),
			);
			return merge(omit(answers, ['getBastion', 'configStoreType']), {
				bastion,
			}) as ConfigStore;
		}

		return answers as ConfigStore;
	}

	async inquireDeployTarget(
		defaultDeployTarget: DeployTarget,
		targetTypes: DeployTargetSelections[],
	): Promise<DeployTarget> {
		function kubernetesDeployTarget(response: object): boolean {
			return get(response, 'deployTargetType') === 'kubernetes';
		}

		function envDeployTarget(response: object): boolean {
			return get(response, 'deployTargetType') === 'envfile';
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
				message: 'Please enter config-store kubernetes api endpoint',
				type: 'input',
				name: 'kubernetesAPI',
				default: get(defaultDeployTarget, 'kubernetesAPI'),
				validate: inquirerValidateFQDN,
			},
			{
				when: kubernetesDeployTarget,
				message: 'Please enter config-store kubernetes namespace',
				type: 'input',
				name: 'kubernetesNamespace',
				default: get(defaultDeployTarget, 'kubernetesNamespace'),
				validate: inquirerValidateString,
			},
			{
				when: envDeployTarget,
				message: 'Please enter config-store envfile path',
				type: 'input',
				name: 'path',
				default: get(defaultDeployTarget, 'path'),
				validate: inquirerValidatePath,
			},
		];

		const answers = await inquirer.prompt(questions);
		if (get(answers, 'getBastion')) {
			const bastion = await EnvironmentEditor.inquireBastion(
				get(defaultDeployTarget, 'bastion'),
			);
			return merge(omit(answers, ['getBastion', 'deployTargetType']), {
				bastion,
			}) as DeployTarget;
		}

		return answers as DeployTarget;
	}

	async save(): Promise<Environment> {
		await writeYaml(this.environment, this.configurationPath);
		return this.environment;
	}
}
