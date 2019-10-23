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
import * as flags from '../lib/flags';

import { Command } from '@oclif/command';
import { generateFrame } from './generate';
import { deployAdapters } from '../lib/controllers/frame/adapter';

/**
 * Deploy Command class
 * Deploys a Frame after building to a given Target
 */
export default class Deploy extends Command {
	static description = 'Deploy a Frame from an Environment to a Target';

	static flags = {
		environmentPath: flags.environmentPath,
		target: flags.target,
		keyframe: flags.keyframePath,
	};

	async run() {
		// Parse command flags
		const { flags } = this.parse(Deploy);

		const frame = await generateFrame(
			flags.environmentPath,
			flags.target,
			flags.keyframe,
		);
		const deployAdapter = getDeployAdapter(flags.target);

		await deployAdapter.deploy(frame);
	}
}

const getDeployAdapter = (target: string) => {
	switch (target.toLowerCase()) {
		case 'kubernetes':
			return deployAdapters.kubernetes();
		default:
			throw new NoValidDeployAdapterError();
	}
};

class NoValidDeployAdapterError extends Error {}
