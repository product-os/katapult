import { get, keys } from 'lodash';
import { render } from 'mustache';
import { basename, join } from 'path';
import { listURI, readFromURI, unwrapKeyframe } from '../../tools';
import { ArchiveStore, Release } from '../archive-store/archive-store';
import { ConfigMap } from '../config-store';
import { Environment } from '../environment-file';
import { EnvironmentValidator } from '../environment-file/environment-validator';

export class ArtifactsGenerator {
	static async create(
		configurationPath: string,
		configMap: ConfigMap,
	): Promise<ArtifactsGenerator> {
		const environment = await new EnvironmentValidator(
			configurationPath,
		).validate();
		const archiveStore = await ArchiveStore.create(environment.archiveStore);
		return new ArtifactsGenerator(environment, configMap, archiveStore);
	}

	private readonly archiveStore: ArchiveStore;
	private readonly environment: Environment;
	private readonly configMap: ConfigMap;

	public constructor(
		environment: Environment,
		configMap: ConfigMap,
		archiveStore: ArchiveStore,
	) {
		this.archiveStore = archiveStore;
		this.environment = environment;
		this.configMap = configMap;
	}

	public async generate(): Promise<boolean> {
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
		await this.archiveStore.write(release);
		console.log('Generated artifacts');
		return true;
	}

	private async extendConfigMap() {
		const keyFrame = await unwrapKeyframe(this.environment.productRepo);
		for (const key of keys(keyFrame)) {
			this.configMap[`${key}-image`] = get(keyFrame, [key, 'image', 'url']);
			this.configMap[`${key}-version`] = get(keyFrame, [key, 'version']);
		}
	}
}
