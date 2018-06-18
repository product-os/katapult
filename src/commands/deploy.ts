import { Command } from '@oclif/command';

import { GenerateDeployFlags } from './generate';

export default class Deploy extends Command {
	static description =
		'Generate Deploy Spec from environment configuration and deploy';

	static flags = GenerateDeployFlags;

	async run() {
		const { flags } = this.parse(Deploy);
		return true;
	}
}
