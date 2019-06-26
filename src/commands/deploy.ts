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
import { Command } from '@oclif/command';

import { initFlags } from './init';

/**
 * Deploy Command class
 * The deploy command is used for generating and deploying deployment artifacts.
 * If an environment configuration doesn't exist, or is out of sync, it's generated/synced.
 */
export default class Deploy extends Command {
	static description =
		'Generate Deploy Spec from environment configuration and deploy';

	static flags = initFlags;

	async run() {
		const { flags } = this.parse(Deploy);
		// TODO: Add implementation
	}
}
