import { Command, flags } from '@oclif/command';

import { EnvironmentEditor } from '../lib/controllers/environment/environment-editor';

export const initializeFlags = {
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

export default class Init extends Command {
	static description = 'Initialize environment configuration';

	static flags = initializeFlags;

	async run() {
		const { flags } = this.parse(Init);
		return (await EnvironmentEditor.create(flags)).initializeEnvironment();
	}
}
