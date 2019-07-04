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
import * as fs from 'mz/fs';

import { ConfigManifest } from '../../src/lib/controllers/config-manifest/config-manifest';
import { validateConfig } from '../../src/lib/controllers/config-validator';

const { expect, should } = chai;

describe('config-manifest', () => {
	it('should use a valid config manifest to test against an invalid config map', async () => {
		// Read invalid config manifest YAML
		const configManifestObj = await ConfigManifest.create(
			__dirname,
			'valid-config-manifest.yml',
		);

		// Read new config map
		const configMap = JSON.parse(
			await fs.readFile(`${__dirname}/invalid-config-map.json`, 'utf-8'),
		);

		// The config map validator returns an array of errors, rather than throwing
		// any (so it can generate/populate internally)
		const errors = validateConfig({
			configMap,
			configManifest: configManifestObj,
			throwErrors: false,
		});
		expect(errors.length).to.equal(2);
	});

	it('should use a valid config manifest to test against a valid config map', async () => {
		// Get new config manifest object
		const configManifestObj = await ConfigManifest.create(
			__dirname,
			'valid-config-manifest.yml',
		);

		// Read new config map
		const configMap = JSON.parse(
			await fs.readFile(`${__dirname}/valid-config-map.json`, 'utf-8'),
		);

		// Expect the validation to work
		const errors = validateConfig({
			configMap,
			configManifest: configManifestObj,
			throwErrors: false,
		});

		expect(errors.length).to.equal(0);
	});
});
