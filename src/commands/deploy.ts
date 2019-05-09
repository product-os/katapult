import { Command } from '@oclif/command';

import generateDeploy = require('../lib/commands/generate-deploy');

import { GenerateDeployFlags } from './generate';

export default class Deploy extends Command {
	static description = 'Generate Deploy Spec from environment configuration and deploy';

	static flags = GenerateDeployFlags;

	async run() {
		const { flags } = this.parse(Deploy);
		flags.deploy = true;

		return generateDeploy(flags).asCallback();
	}
}
