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
import { render } from 'mustache';
import * as fs from 'mz/fs';
import * as openpgp from 'openpgp';
import * as path from 'path';

import { listUri, readFromUri, unwrapKeyframe } from '../../tools';
import { ArtifactsStore, Release } from '../artifacts-store/artifacts-store';
import { ConfigMap } from '../config-store/config-store';
import { Environment } from '../environment';

/**
 * ArtifactsGenerator class
 * Used for generating deployment artifacts.
 */
export class ArtifactsGenerator {
	/**
	 * Creates an ArtifactsGenerator using:
	 * @param {Environment} environment
	 * @param {ConfigMap} configMap
	 * @returns {Promise<ArtifactsGenerator>}
	 */
	static async create(
		environment: Environment,
		configMap: ConfigMap,
	): Promise<ArtifactsGenerator> {
		const archiveStore = await ArtifactsStore.create(environment.archiveStore);
		return new ArtifactsGenerator({ environment, configMap, archiveStore });
	}

	private readonly archiveStore: ArtifactsStore;
	private readonly environment: Environment;
	private readonly configMap: ConfigMap;

	/**
	 * ArtifactsGenerator constructor
	 * @param {Environment} environment
	 * @param {ConfigMap} configMap
	 * @param {ArtifactsStore} archiveStore
	 */
	public constructor({
		environment,
		configMap,
		archiveStore,
	}: {
		environment: Environment;
		configMap: ConfigMap;
		archiveStore: ArtifactsStore;
	}) {
		this.archiveStore = archiveStore;
		this.environment = environment;
		this.configMap = configMap;
	}

	/**
	 * This method Generates deploy artifacts, and returns them as a Release.
	 * @returns {Promise<Release>}
	 */
	public async generate(): Promise<Release> {
		const target = _.keys(this.environment.deployTarget)[0];
		const templatesPath = path.join('deploy', target, 'templates');
		const templateFilePaths = await listUri({
			uri: this.environment.productRepo,
			path: templatesPath,
		});
		const release: Release = {};
		for (const file of templateFilePaths) {
			const template = await readFromUri({
				uri: this.environment.productRepo,
				path: path.join(templatesPath, file),
			});
			const manifestPath = path.join(
				target,
				path.basename(file).replace('.tpl.', '.'),
			);
			release[manifestPath] = render(template, this.configMap);
		}
		console.log('Generated artifacts');
		return release;
	}

	/**
	 * This method stores deployment artifacts.
	 * @param {Release} release
	 * @returns {Promise<void>}
	 */
	public async store(release: Release): Promise<void> {
		await this.archiveStore.write(await this.encryptRelease(release));
	}

	/**
	 * This method extends a ConfigMap with keyFrame data
	 * @returns {Promise<void>}
	 */
	private async extendConfigMap() {
		const keyFrame = await unwrapKeyframe(this.environment.productRepo);
		_.forEach(keyFrame, (value, key) => {
			this.configMap[`${key}-image`] = _.get(value, ['image', 'url']);
			this.configMap[`${key}-version`] = _.get(value, ['version']);
		});
	}

	/**
	 * This method encrypts a release.
	 * @param {Release} release
	 * @returns {Promise<Release>}
	 */
	private async encryptRelease(release: Release): Promise<Release> {
		if (this.environment.encryptionKeyPath) {
			const encryptionKey = (await fs.readFile(
				this.environment.encryptionKeyPath,
			)).toString();
			const publicKeys = (await openpgp.key.readArmored(encryptionKey)).keys;
			for (const key of _.keys(release)) {
				const encrypted = await openpgp.encrypt({
					message: openpgp.message.fromText(release[key]),
					publicKeys,
				});
				release[key] = encrypted.data;
			}
		}
		return release;
	}
}
