import { NotImplementedError, UnsupportedError } from '../../error-types';
import { gitURI, localPathURI } from '../../tools';
import { LocalArchiveStoreAdapter } from './adapters/local';

export interface Release {
	[key: string]: string;
}

export class ArtifactsStore {
	public static async create(archiveStoreURI: string): Promise<ArtifactsStore> {
		let adapter: LocalArchiveStoreAdapter;

		if (await localPathURI(archiveStoreURI)) {
			adapter = new LocalArchiveStoreAdapter(archiveStoreURI);
		} else if (gitURI(archiveStoreURI)) {
			throw new NotImplementedError('Git URI support not implemented yet');
		} else {
			throw new UnsupportedError('URI type not supported yet');
		}
		return new ArtifactsStore(adapter);
	}

	private readonly adapter: LocalArchiveStoreAdapter;

	public constructor(adapter: LocalArchiveStoreAdapter) {
		this.adapter = adapter;
	}

	/**
	 * Write the archives from sourcePath to the archive store.
	 * @param {string} release: Release object of archive manifests.
	 * @returns {Promise<boolean>} : true in case of success.
	 */
	async write(release: Release): Promise<void> {
		return await this.adapter.write(release);
	}
}
