import { Frame } from '../../src/lib/controllers/frame/frame';
import * as frameGenerator from '../../src/lib/controllers/frame/frame-generator';
import * as frameTemplate from '../../src/lib/controllers/frame-template';
import { exportAdapters } from '../../src/lib/controllers/frame/adapter';
import { mustacheRenderer } from '../../src/lib/controllers/frame-template/renderer/mustache';
import {
	ConfigStore,
	ConfigMap,
	createConfigStore,
} from '../../src/lib/controllers/config-store/config-store';

import { expect } from 'chai';
import * as fs from 'mz/fs';
import * as path from 'path';
import * as temp from 'temp';
import { getTestFile, getTestDir } from '../files';
import { EnvConfigStoreAccess } from '../../src/lib/controllers/environment';
import { ConfigManifest } from '../../src/lib/controllers/config-manifest/config-manifest';
import { ConfigurationManager } from '../../src/lib/controllers/configuration-manager/configuration-manager';

describe('frame-generator', () => {
	const configMap: ConfigMap = {
		BALENA_TLD: 'fish.local',
	};

	const configStore: ConfigStore = {
		list: async () => configMap,
		updateMany: async () => configMap,
	};

	let frameTemplateDir = '';
	let frame: Frame = { files: {} };
	let tempDir = '';

	before(async () => {
		tempDir = temp.track().mkdirSync();
		frameTemplateDir = await getTestDir(
			'test-product-staging/product/deploy/docker-compose/templates',
		);
	});

	after(() => {
		temp.cleanupSync();
	});

	it('should create a Frame from a mustache-formatted FrameTemplate', async () => {
		const ft = await frameTemplate.fromDirectory(frameTemplateDir);
		frame = await frameGenerator.generate(ft, mustacheRenderer, configStore);

		expect(frame.files['docker-compose.yml']).is.not.undefined;
		expect(frame.files['docker-compose.yml']).contains(
			'BALENA_TLD: fish.local',
		);
	});

	it('should export the Frame to the filesystem', async () => {
		// export the Frame to the filesystem...
		await exportAdapters.filesystem(tempDir).export(frame);

		// make sure the files exist...
		for (const file of ['docker-compose.yml']) {
			const filePath = path.join(tempDir, file);
			expect(await fs.exists(filePath)).to.equal(true);
		}
	});

	it('should create a Frame using a valid ConfigStore', async () => {
		// create the config manifest
		const configManifest = await ConfigManifest.create(
			await getTestDir('test-product-staging/product'),
		);

		// create an Environment ConfigStore instance
		const configStore = await createConfigStore({
			envFile: {
				path: await getTestFile('test-product-staging/product.env'),
			},
		});

		// sync the environment configmap
		const configManager = await ConfigurationManager.create({
			mode: 'quiet',
			configManifest,
			configStore,
		});

		// ensure the config map is synced
		await configManager.sync();

		// create the frame
		const ft = await frameTemplate.fromDirectory(frameTemplateDir);
		const frame = await frameGenerator.generate(
			ft,
			mustacheRenderer,
			configStore,
		);

		expect(frame.files['docker-compose.yml']).is.not.undefined;
		expect(frame.files['docker-compose.yml']).contains(
			'BALENA_TLD: fish.local',
		);
	});
});
