import { gitURI, localPathURI } from '../../tools';
import { LocalArchiveStoreAdapter } from './adapters/local';

export interface Release {
	[key: string]: string;
}

export class ArchiveStore {
	public static async create(archiveStoreURI: string): Promise<ArchiveStore> {
		let adapter: LocalArchiveStoreAdapter;

		if (await localPathURI(archiveStoreURI)) {
			adapter = new LocalArchiveStoreAdapter(archiveStoreURI);
		} else if (gitURI(archiveStoreURI)) {
			throw new Error('Not implemented');
		} else {
			throw new Error('Not implemented');
		}
		return new ArchiveStore(adapter);
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
	async write(release: Release): Promise<boolean> {
		return await this.adapter.write(release);
	}
}
