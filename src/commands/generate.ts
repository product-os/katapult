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
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import { fs } from 'mz';
import * as path from 'path';
import * as flags from '../lib/flags';
import * as frameGenerator from '../lib/controllers/frame/frame-generator';
import * as templateGenerator from '../lib/controllers/template-generator/template-generator';
import * as frameTemplate from '../lib/controllers/frame-template';

import { Command } from '@oclif/command';
import { ConfigManifest } from '../lib/controllers/config-manifest/config-manifest';
import { createConfigStore } from '../lib/controllers/config-store/config-store';
import { ConfigurationManager } from '../lib/controllers/configuration-manager/configuration-manager';
import {
	loadEnvironment,
	EnvironmentContext,
} from '../lib/controllers/environment/environment';
import * as frameAdapter from '../lib/controllers/frame/adapter/filesystem';
import * as templateAdapter from '../lib/controllers/frame-template/adapter/filesystem';
import * as templateRenderer from '../lib/controllers/frame-template/renderer/mustache';
import * as generatorRenderer from '../lib/controllers/template-generator/renderer/mustache';
import { loadKeyframe } from '../lib/controllers/keyframe/index';
import { ConfigStoreError } from '../lib/error-types';
import { Frame } from '../lib/controllers/frame/frame';
import { ConfigStoreAccess } from '../lib/controllers/config-store';

/**
 * Generate Command class
 * The init command is used for generating deployment artifacts, using an environment configuration.
 * If an environment configuration doesn't exist, or is out of sync, it's generated/synced.
 */

export const generateFrame = async (
	environmentPath: string,
	target: string,
	keyframePath?: string,
): Promise<Frame> => {
	// get our directory context correct
	const getEnvironmentDirectory = async (p: string) => {
		if ((await fs.stat(p)).isDirectory()) {
			return p;
		}

		return path.dirname(p);
	};

	const environmentDir = await getEnvironmentDirectory(environmentPath);
	const productDir = path.join(environmentDir, 'product');
	const resolvedKeyframePath =
		keyframePath || path.join(productDir, 'keyframe.yml');

	// find the manifests to use...
	const manifestFiles = await Bluebird.filter(
		[
			'config-manifest.yml', // product-specific manifest
			`deploy/${target}/config-manifest.yml`, // target-specific manifest
		],
		async p => await fs.exists(path.join(productDir, p)),
	);

	// create a merged manifest...
	const configManifest = await ConfigManifest.create(productDir, manifestFiles);

	// create a context for the environment...
	const context = await loadEnvironment(environmentDir);

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
	const frameGeneratorDir = path.normalize(
		path.join(productDir, `deploy/${target}/generators`),
	);

	// create the frame templates
	const frameTemplateDir = path.normalize(
		path.join(productDir, `deploy/${target}/templates`),
	);

	// read the keyframe
	const keyframe = await loadKeyframe(resolvedKeyframePath);

	// read the generators
	const frameGenerators = await frameTemplate.fromDirectory(frameGeneratorDir);

	// generate the frame templates...
	const generatedFrameTemplates = await templateGenerator.generate(
		frameGenerators,
		generatorRenderer.Renderer,
		keyframe,
	);

	// export the templates to the filesystem...
	await templateAdapter
		.filesystemExportAdapter(frameTemplateDir)
		.export(generatedFrameTemplates);

	// read the templates
	const frameTemplates = await frameTemplate.fromDirectory(frameTemplateDir);

	return await frameGenerator.generate(
		frameTemplates,
		templateRenderer.Renderer,
		configStore,
	);
};

const getConfigStore = async (ctx: EnvironmentContext) => {
	const configStoreDefinition = ctx.environment['config-store'];

	if (configStoreDefinition.envfile !== undefined) {
		return await createConfigStore({
			envFile: {
				path: path.normalize(
					path.join(ctx.directory, configStoreDefinition.envfile.path),
				),
			},
		});
	}

	if (configStoreDefinition.kubernetes !== undefined) {
		const defaults: ConfigStoreAccess = {
			kubernetes: {
				kubeconfig: '',
				namespace: '',
			},
		};

		const fromEnv = {
			kubernetes: {
				kubeconfig: process.env.KATAPULT_KUBE_CONFIG,
				namespace: process.env.KATAPULT_KUBE_NAMESPACE,
			},
		};

		const config = configStoreDefinition.kubernetes;
		const fromConfig =
			config !== null
				? {
						kubernetes: {
							kubeconfig: config.kubeconfig,
							namespace: config.namespace,
						},
				  }
				: {};

		const kubernetesAccess = _.merge(defaults, fromConfig, fromEnv, {
			kubernetes: { bastion: undefined },
		});

		if (
			Object.keys(process.env).filter(k =>
				k.startsWith('KATAPULT_KUBE_BASTION_'),
			).length > 0
		) {
			kubernetesAccess.kubernetes.bastion = _.merge(
				kubernetesAccess.kubernetes.bastion,
				{
					apiHost: process.env.KATAPULT_KUBE_BASTION_API_HOST,
					apiPort: process.env.KATAPULT_KUBE_BASTION_API_PORT,
					host: process.env.KATAPULT_KUBE_BASTION_HOST,
					port: process.env.KATAPULT_KUBE_BASTION_PORT,
					username: process.env.KATAPULT_KUBE_BASTION_USER,
					key: process.env.KATAPULT_KUBE_BASTION_KEY,
					keyPassphrase: process.env.KUBE_BASTION_KEY_PASSPHRASE,
				},
			);
		}

		if (config != null && config.bastion != null) {
			kubernetesAccess.kubernetes.bastion = _.merge(
				kubernetesAccess.kubernetes.bastion,
				{
					apiHost: config.bastion.apiHost,
					apiPort: config.bastion.apiPort,
					host: config.bastion.host,
					port: config.bastion.port,
					username: config.bastion.user,
					key: config.bastion.key,
					keyPassphrase: config.bastion.passphrase,
				},
			);
		}

		return await createConfigStore(kubernetesAccess as ConfigStoreAccess);
	}

	throw new ConfigStoreError(
		`Unable to create a config store for the chosen provider '${Object.keys(
			configStoreDefinition,
		).join(',')}'`,
	);
};

export default class Generate extends Command {
	static description = 'Generate a Frame from an Environment';

	static flags = {
		environmentPath: flags.environmentPath,
		outputPath: flags.outputPath,
		target: flags.target,
		keyframe: flags.keyframePath,
	};

	async run() {
		// Parse command flags
		const { flags } = this.parse(Generate);

		const frame = await generateFrame(
			flags.environmentPath,
			flags.target,
			flags.keyframe,
		);

		const outputTo = path.normalize(path.join(flags.outputPath, flags.target));
		await frameAdapter.filesystemDeployAdapter(outputTo).deploy(frame);
	}
}
