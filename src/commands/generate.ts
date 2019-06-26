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
import * as _ from 'lodash';

import { ArtifactsGenerator } from '../lib/controllers/artifacts-generator/artifacts-generator';
import { ConfigManifest } from '../lib/controllers/config-manifest/config-manifest';
import { ConfigStore } from '../lib/controllers/config-store/config-store';
import { ConfigurationManager } from '../lib/controllers/configuration-manager/configuration-manager';
import { EnvironmentEditor } from '../lib/controllers/environment/environment-editor';
import { convertRelativePaths, getBasePath, loadFromUri } from '../lib/tools';
import { initFlags } from './init';

/**
 * Generate Command class
 * The init command is used for generating deployment artifacts, using an environment configuration.
 * If an environment configuration doesn't exist, or is out of sync, it's generated/synced.
 */
export default class Generate extends Command {
	static description = 'Generate Deploy Spec from environment configuration';

	static flags = initFlags;

	async run() {
		// Parse command flags
		const { flags } = this.parse(Generate);

		// Get or create the katapult environment object, resolving relative paths
		const environment = convertRelativePaths({
			conf: await (await EnvironmentEditor.create(flags)).initializeEnvironment(
				false,
			),
			basePath: getBasePath(flags.configurationPath),
		});

		// Environment ConfigStore instance
		const configStore = await ConfigStore.create(
			_.get(environment, 'configStore'),
		);

		// Environment ConfigManifest instance
		const configManifest = new ConfigManifest(
			await loadFromUri({
				uri: _.get(environment, 'productRepo'),
				path: 'config-manifest.yml',
			}),
		);

		// Sync the environment configmap
		const configMap = (await ConfigurationManager.create({
			mode: flags.mode,
			configManifest,
			configStore,
		})).sync();

		// Generate environment artifacts
		const generator = await ArtifactsGenerator.create(environment, configMap);
		await generator.generate();
	}
}
