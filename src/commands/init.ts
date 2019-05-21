import { Command, flags } from '@oclif/command';

import { EnvironmentEditorArgs } from '../lib/controllers/environment-file';
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

	static async initializeEnvironment(args: EnvironmentEditorArgs) {
		const editor = await EnvironmentEditor.createEnvironmentEditor(args);
		await editor.inquire();
		await editor.save();
		return true;
	}

	async run() {
		const { flags } = this.parse(Init);
		return Init.initializeEnvironment(flags as EnvironmentEditorArgs);
	}
}
