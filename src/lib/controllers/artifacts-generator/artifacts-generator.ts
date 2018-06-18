import { get, keys } from 'lodash';
import { render } from 'mustache';
import * as fs from 'mz/fs';
import { encrypt, key, message } from 'openpgp';
import { basename, join } from 'path';

import { listURI, readFromURI, unwrapKeyframe } from '../../tools';
import { ArtifactsStore, Release } from '../artifacts-store/artifacts-store';
import { ConfigMap } from '../config-store';
import { Environment } from '../environment';

export class ArtifactsGenerator {
	static async create(
		environment: Environment,
		configMap: ConfigMap,
	): Promise<ArtifactsGenerator> {
		const archiveStore = await ArtifactsStore.create(environment.archiveStore);
		return new ArtifactsGenerator(environment, configMap, archiveStore);
	}

	private readonly archiveStore: ArtifactsStore;
	private readonly environment: Environment;
	private readonly configMap: ConfigMap;

	public constructor(
		environment: Environment,
		configMap: ConfigMap,
		archiveStore: ArtifactsStore,
	) {
		this.archiveStore = archiveStore;
		this.environment = environment;
		this.configMap = configMap;
	}

	public async generate(): Promise<void> {
		await this.extendConfigMap();
		const target = keys(this.environment.deployTarget)[0];
		const templatesPath = join('deploy', target, 'templates');
		const templateFilePaths = await listURI(
			this.environment.productRepo,
			templatesPath,
		);
		const release: Release = {};
		for (const file of templateFilePaths) {
			const template = await readFromURI(
				this.environment.productRepo,
				join(templatesPath, file),
			);
			const manifestString = render(template, this.configMap);
			const manifestPath = join(target, basename(file).replace('.tpl.', '.'));
			release[manifestPath] = manifestString;
		}
		const outputRelease = await this.encryptRelease(release);
		await this.archiveStore.write(outputRelease);
		console.log('Generated artifacts');
	}

	private async extendConfigMap() {
		const keyFrame = await unwrapKeyframe(this.environment.productRepo);
		for (const key of keys(keyFrame)) {
			this.configMap[`${key}-image`] = get(keyFrame, [key, 'image', 'url']);
			this.configMap[`${key}-version`] = get(keyFrame, [key, 'version']);
		}
	}

	private async encryptRelease(release: Release): Promise<Release> {
		if (this.environment.encryptionKeyPath) {
			const encryptionKey = (await fs.readFile(
				this.environment.encryptionKeyPath,
			)).toString();
			const publicKeys = (await key.readArmored(encryptionKey)).keys;
			for (const key of keys(release)) {
				const encrypted = await encrypt({
					message: message.fromText(release[key]),
					publicKeys,
				});
				release[key] = encrypted.data;
			}
		}
		return release;
	}
}
