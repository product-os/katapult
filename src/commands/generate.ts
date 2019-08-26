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
import * as _ from 'lodash';
import { fs } from 'mz';
import * as path from 'path';
import * as flags from '../lib/flags';
import * as frameGenerator from '../lib/controllers/frame/frame-generator';
import * as frameTemplate from '../lib/controllers/frame-template';

import { Command } from '@oclif/command';
import { ConfigManifest } from '../lib/controllers/config-manifest/config-manifest';
import { createConfigStore } from '../lib/controllers/config-store/config-store';
import { ConfigurationManager } from '../lib/controllers/configuration-manager/configuration-manager';
import {
	loadEnvironment,
	EnvironmentContext,
} from '../lib/controllers/environment/environment';
import {
	filesystemExportAdapter,
	InvalidOutputDirectory,
} from '../lib/controllers/frame/adapter/filesystem';
import { mustacheRenderer } from '../lib/controllers/frame-template/renderer/mustache';
import { ConfigStoreError } from '../lib/error-types';

/**
 * Generate Command class
 * The init command is used for generating deployment artifacts, using an environment configuration.
 * If an environment configuration doesn't exist, or is out of sync, it's generated/synced.
 */
export default class Generate extends Command {
	static description = 'Generate a Frame from an Environment';

	static flags = {
		environmentPath: flags.environmentPath,
		outputPath: flags.outputPath,
		target: flags.target,
	};

	async run() {
		// Parse command flags
		const { flags } = this.parse(Generate);

		// get our directory context correct
		const getRepoDirectory = (p: string) => {
			if (fs.statSync(p).isDirectory()) {
				return p;
			}

			return path.dirname(p);
		};

		const repoDir = getRepoDirectory(flags.environmentPath);
		const productDir = path.join(repoDir, 'product');

		// find the manifests to use...
		const manifestFiles = [
			'config-manifest.yml', // product-specific manifest
			`deploy/${flags.target}/config-manifest.yml`, // target-specific manifest
		].filter(p => fs.existsSync(path.join(productDir, p)));

		// create a merged manifest...
		const configManifest = await ConfigManifest.create(
			productDir,
			manifestFiles,
		);

		// create a context for the environment...
		const context = await loadEnvironment(repoDir);

		// create an Environment ConfigStore instance
		const configStore = await getConfigStore(context);

		// sync the environment configmap
		const configManager = await ConfigurationManager.create({
			mode: 'quiet',
			configManifest,
			configStore,
		});

		// ensure the config map is synced
		await configManager.sync();

		// create the frame
		const frameTemplateDir = path.normalize(
			path.join(productDir, `deploy/${flags.target}/templates`),
		);

		const ft = await frameTemplate.fromDirectory(frameTemplateDir);
		const frame = await frameGenerator.generate(
			ft,
			mustacheRenderer,
			configStore,
		);

		const outputTo = path.normalize(path.join(flags.outputPath, flags.target));
		try {
			await filesystemExportAdapter(outputTo).export(frame);
		} catch (e) {
			console.error('Unable to export frame to the filesystem');
			console.error(e);
			this.exit(2);
		}
	}
}

const getConfigStore = async (ctx: EnvironmentContext) => {
	const configStoreDefinition = ctx.environment['config-store'];

	if (configStoreDefinition.envfile != null) {
		return await createConfigStore({
			envFile: {
				path: path.normalize(
					path.join(ctx.directory, configStoreDefinition.envfile.path),
				),
			},
		});
	} else {
		throw new ConfigStoreError(
			'Unable to create a config store for the chosen provider',
		);
	}
};
