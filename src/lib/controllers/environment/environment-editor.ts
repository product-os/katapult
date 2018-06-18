import * as _ from 'lodash';
import {
	ConfigStoreAccess,
	ConfigStoreAccessConfiguration,
	Environment,
	KatapultFile,
} from '.';
import { ConfigurationManager } from '../configuration-manager/configuration-manager';

import { convertRelativePaths, getBasePath } from '../../tools';
import { ConfigManifest } from '../config-manifest/config-manifest';
import { ConfigStore } from '../config-store/config-store';

export declare interface EnvironmentEditorCreateArgs {
	configurationPath: string;
	mode?: string;
}

export declare interface EnvironmentEditorArgs {
	katapultConfigStore: ConfigStore;
	katapultConfigManifest: ConfigManifest;
	environmentConfigManifest: ConfigManifest;
	configurationPath: string;
	mode: string;
}

export class EnvironmentEditor {
	static async create(
		args: EnvironmentEditorCreateArgs,
	): Promise<EnvironmentEditor> {
		const { configurationPath, mode = 'interactive' } = args;
		const configStoreAccess = {
			yamlFile: {
				path: configurationPath,
			},
		};
		const katapultConfigStore = await ConfigStore.create(
			convertRelativePaths({
				conf: configStoreAccess,
				basePath: process.cwd(),
			}),
		);
		const katapultConfigManifest = await ConfigManifest.create(
			__dirname,
			'katapult-config-manifest.yml',
		);
		const environmentConfigManifest = await ConfigManifest.create(
			__dirname,
			'environment-config-manifest.yml',
		);

		return new EnvironmentEditor({
			katapultConfigStore,
			katapultConfigManifest,
			environmentConfigManifest,
			configurationPath,
			mode,
		});
	}

	public static getEnvironmentConfigStoreAccess(
		conf: ConfigStoreAccessConfiguration,
	): ConfigStoreAccess {
		return { [conf['type']]: _.omit(conf, 'type') };
	}

	private readonly katapultConfigStore: ConfigStore;
	private readonly katapultConfigManifest: ConfigManifest;
	private readonly environmentConfigManifest: ConfigManifest;
	private readonly configurationPath: string;
	private readonly mode: string;

	public constructor(args: EnvironmentEditorArgs) {
		const {
			katapultConfigStore,
			katapultConfigManifest,
			environmentConfigManifest,
			configurationPath,
			mode,
		} = args;
		this.katapultConfigStore = katapultConfigStore;
		this.katapultConfigManifest = katapultConfigManifest;
		this.environmentConfigManifest = environmentConfigManifest;
		this.configurationPath = configurationPath;
		this.mode = mode;
	}

	async initializeEnvironment(init = true): Promise<Environment> {
		// initialize the environment.yml file
		const cm = await ConfigurationManager.create({
			configStore: this.katapultConfigStore,
			configManifest: this.katapultConfigManifest,
			configMap: init ? {} : await this.katapultConfigStore.list(),
			mode: this.mode,
		});

		// initialize deployment/environment configuration in environment ConfigStore.
		const configStoreAccess = convertRelativePaths({
			conf: EnvironmentEditor.getEnvironmentConfigStoreAccess(
				(await cm.sync())['config-store'],
			),
			basePath: getBasePath(this.configurationPath),
		});
		const configStore = await ConfigStore.create(configStoreAccess);
		const config = await (await ConfigurationManager.create({
			configManifest: this.environmentConfigManifest,
			configStore,
			configMap: init ? {} : await configStore.list(),
			mode: this.mode,
		})).sync();
		return {
			configStore: configStoreAccess,
			productRepo: _.get(config, 'katapultEnvironment.productRepo'),
			archiveStore: _.get(config, 'katapultEnvironment.archiveStore'),
			encryptionKeyPath: _.get(config, 'katapultEnvironment.encryptionKeyPath'),
			deployTarget: {
				[_.get(
					config,
					'katapultEnvironment.deployTarget.type',
				)]: convertRelativePaths({
					conf: _.omit(
						_.get(config, 'katapultEnvironment.deployTarget'),
						'type',
					),
					basePath: getBasePath(this.configurationPath),
				}),
			},
		};
	}
}
