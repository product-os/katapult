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
import * as chai from 'chai';
import * as _ from 'lodash';

import { ConfigManifest } from '../../src/lib/controllers/config-manifest/config-manifest';
import { createConfigStore } from '../../src/lib/controllers/config-store/config-store';
import { EnvConfigStoreAccess } from '../../src/lib/controllers/environment';
import { ConfigurationManager } from '../../src/lib/controllers/configuration-manager/configuration-manager';
import { getTestDir } from '../files';

const { expect } = chai;

describe('config-manager', async () => {
	it('create a config manager and use it on a non-fully-populated config store', async () => {
		const filesDir = await getTestDir('configs');

		// Environment ConfigStore instance
		const envStore: EnvConfigStoreAccess = {
			path: `${filesDir}/invalid-config-store.env`,
		};
		const configStore = await createConfigStore({
			envFile: envStore,
		});

		// Create the correct config manifest
		const configManifest = await ConfigManifest.create(filesDir, [
			'valid-config-manifest.yml',
		]);

		// Sync the environment configmap
		const configManager = await ConfigurationManager.create({
			mode: 'interactive',
			configManifest,
			configStore,
		});

		// Should fail with
		return configManager
			.sync()
			.then(() => {
				throw new Error('Should not have returned a valid config map');
			})
			.catch(err => {
				expect(err.message).to.include(
					'Required properties are missing from the config store:',
				);
			});
	});

	it('create a config manager and use it on a fully-populated config store', async () => {
		const filesDir = await getTestDir('configs');

		// Environment ConfigStore instance
		const envStore: EnvConfigStoreAccess = {
			path: `${filesDir}/valid-config-store.env`,
		};
		const configStore = await createConfigStore({
			envFile: envStore,
		});

		// Create the correct config manifest
		const configManifest = await ConfigManifest.create(filesDir, [
			'valid-config-manifest.yml',
		]);

		// Sync the environment configmap
		const configManager = await ConfigurationManager.create({
			mode: 'quiet',
			configManifest,
			configStore,
		});

		// Ensure the config map is synced
		const configMap = await configManager.sync();

		expect(configMap).to.have.keys(
			'BALENA_TLD',
			'BALENA_DEVICE_UUID',
			'PRODUCTION_MODE',
			'JSON_WEB_TOKEN_SECRET',
		);
	});
});
