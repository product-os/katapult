import { Command, flags } from '@oclif/command';
import { EnvironmentEditor } from '../lib/controllers/environment/environment-editor';

const syncFlags = {
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

export default class SyncCommand extends Command {
	static description = 'Sync environment configuration';

	static flags = syncFlags;

	async run() {
		const { flags } = this.parse(SyncCommand);

		return (await EnvironmentEditor.create(flags)).initializeEnvironment(false);
	}
}
