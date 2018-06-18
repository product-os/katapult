import { Command, flags } from '@oclif/command';

import { ArtifactsGenerator } from '../lib/controllers/artifacts-generator/artifacts-generator';
import { ConfigManifest } from '../lib/controllers/config-manifest/config-manifest';
import { ConfigStore } from '../lib/controllers/config-store/config-store';
import { ConfigurationManager } from '../lib/controllers/configuration-manager/configuration-manager';
import { EnvironmentEditor } from '../lib/controllers/environment/environment-editor';
import { convertRelativePaths, getBasePath, readFromURI } from '../lib/tools';

export const GenerateDeployFlags = {
	configurationPath: flags.string({
		description: 'URI of the environment configuration path',
		required: true,
		default: './environment.yml',
		char: 'c',
	}),

	mode: flags.string({
		description: 'Determine how to resolve data which is missing at runtime.',
		options: ['interactive', 'quiet', 'edit'],
		default: 'interactive',
		char: 'm',
	}),
};

export default class Generate extends Command {
	static description = 'Generate Deploy Spec from environment configuration';

	static flags = GenerateDeployFlags;

	async run() {
		const { flags } = this.parse(Generate);
		const environment = convertRelativePaths({
			conf: await (await EnvironmentEditor.create(flags)).initializeEnvironment(
				false,
			),
			basePath: getBasePath(flags.configurationPath),
		});
		const configStore = await ConfigStore.create(environment.configStore);
		const configManifest = new ConfigManifest(
			await readFromURI(environment.productRepo, 'config-manifest.yml'),
		);
		const configMap = (await ConfigurationManager.create({
			mode: flags.mode,
			configManifest,
			configStore,
		})).sync();

		const generator = await ArtifactsGenerator.create(environment, configMap);
		await generator.generate();
		return true;
	}
}
