import { Command, flags } from '@oclif/command';

import { EnvironmentEditorArgs } from '../lib/controllers/environment-file';
import { EnvironmentEditor } from '../lib/controllers/environment-file/environment-editor';

export const initializeFlags = {
	configurationPath: flags.string({
		description: 'URI of the environment configuration path',
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
		return EnvironmentEditor.initializeEnvironment(
			flags as EnvironmentEditorArgs,
		);
	}
}
