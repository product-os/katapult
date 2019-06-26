/*
Copyright 2019 Balena Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import { Command, flags } from '@oclif/command';

import { EnvironmentEditor } from '../lib/controllers/environment/environment-editor';

/**
 * Init Command Parameters
 */
export const initFlags = {
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

/**
 * Init Command class
 * The init command is used for initializing environment configuration
 */
export default class Init extends Command {
	static description = 'Initialize environment configuration';

	static flags = initFlags;

	async run() {
		// Parse command flags
		const { flags } = this.parse(Init);

		// Initialize the katapult environment object
		return (await EnvironmentEditor.create(flags)).initializeEnvironment();
	}
}
