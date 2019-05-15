import inquirer = require('inquirer');

import { get, merge, omit } from 'lodash';

import {
	Bastion,
	ConfigStore,
	DeployTarget,
	EnvironmentEditorArgs,
	EnvironmentObject,
} from '.';
import {
	configStoreTypes,
	deployTargetTypes,
	loadFromFileSync,
	writeYamlSync,
} from '../../tools';
import {
	inquirerValidateDirectory,
	inquirerValidateFQDN,
	inquirerValidatePath,
	inquirerValidatePort,
	inquirerValidateString,
} from '../../validators';

import { Environment } from './environment';

export class EnvironmentEditor {
	static async inquireBastion(defaultBastion?: Bastion): Promise<object> {
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
		return inquirer.prompt(questions);
	}

	verbose: boolean;
	environment: Environment;
	configurationPath: string;

	public constructor(args: EnvironmentEditorArgs) {
		const { configurationPath, verbose = false } = args;
		this.configurationPath = configurationPath;
		this.verbose = verbose;

		// A default environment for some default suggestions It might be replaced below.
		this.environment = new Environment({
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
		});

		try {
			if (configurationPath) {
				this.environment = loadFromFileSync(configurationPath) as Environment;
				if (this.verbose) {
					console.log('loaded:', configurationPath);
				}
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
		const configStore = await this.inquireConfigStore(
			get(this.environment, 'configStore'),
		);
		const deployTarget = await this.inquireDeployTarget(
			get(this.environment, 'deployTarget'),
		);
		this.environment = new Environment(merge(answers, {
			configStore,
			deployTarget,
		}) as EnvironmentObject);
		return this.environment;
	}

	async inquireConfigStore(defaultConfigStore: ConfigStore): Promise<object> {
		const questions = [
			{
				message: 'Please select config-store type',
				type: 'list',
				name: 'configStoreType',
				choices: configStoreTypes,
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
			return {
				configStore: merge(omit(answers, ['getBastion', 'configStoreType']), {
					bastion,
				}),
			};
		}
		return answers;
	}

	async inquireDeployTarget(
		defaultDeployTarget: DeployTarget,
	): Promise<object> {
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
				choices: deployTargetTypes,
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
			return {
				configStore: merge(omit(answers, ['getBastion', 'deployTargetType']), {
					bastion,
				}),
			};
		}
		return answers;
	}
	save(): Environment {
		writeYamlSync(this.environment, this.configurationPath);
		return this.environment;
	}
}
