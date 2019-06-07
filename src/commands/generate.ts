import { Command, flags } from '@oclif/command';

import { ArtifactsGenerator } from '../lib/controllers/artifacts-generator/artifacts-generator';
import { ConfigurationManagerCreateArgs } from '../lib/controllers/configuration-manager';
import { ConfigurationManager } from '../lib/controllers/configuration-manager/configuration-manager';

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
		const cm = await ConfigurationManager.create(
			flags as ConfigurationManagerCreateArgs,
		);
		const confMap = await cm.sync();
		const generator = await ArtifactsGenerator.create(
			flags.configurationPath,
			confMap,
		);
		await generator.generate();
		return true;
	}
}
