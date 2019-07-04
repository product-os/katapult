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

import { ConfigManifest } from '../../src/lib/controllers/config-manifest/config-manifest';
import { getTestFile, getTestDir } from '../files';

const { expect } = chai;

describe('config-manifest', () => {
	it('should read an invalid config manifest and throw an error', async () => {
		const configManifestObj = await ConfigManifest.create(
			await getTestDir('configs'),
			'invalid-config-manifest.yml',
		);

		// Request the native object manifest - should error
		expect(() => configManifestObj.getConfigManifestSchema()).to.throw();
	});

	it('should read a valid config manifest and return it', async () => {
		// Read invalid config manifest YAML
		const configManifestObj = await ConfigManifest.create(
			await getTestDir('configs'),
			'valid-config-manifest.yml',
		);

		// Request the native object manifest
		const configManifest = configManifestObj.getConfigManifestSchema();

		// Test for expected version, title and properties
		expect(configManifest)
			.to.have.property('version')
			.equal('1');
		expect(configManifest)
			.to.have.property('title')
			.equal('Config manifest');
		expect(configManifest)
			.to.have.property('properties')
			.that.has.length(4);
	});
});
