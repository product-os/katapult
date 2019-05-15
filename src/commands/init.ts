import { Command, flags } from '@oclif/command';

import { EnvironmentEditor } from '../lib/controllers/environment-file/environmentEditor';

export const initializeFlags = {
	configurationPath: flags.string({
		description: 'URI to deploy-template folder/repo',
		required: true,
		default: './environment.yml',
		char: 'c',
	}),

	verbose: flags.boolean({
		description: 'Enable verbose mode',
		char: 'v',
		default: false,
	}),
};

export default class Init extends Command {
	static description = 'Initialize environment configuration';

	static flags = initializeFlags;

	async run() {
		const { flags } = this.parse(Init);
		const editor = await new EnvironmentEditor(flags);
		await editor.inquire();
		await editor.save();
		return editor.environment;
	}
}
