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
import { NotImplementedError, UnsupportedError } from '../../error-types';
import { gitUri, localPathUri } from '../../tools';
import { LocalArchiveStoreAdapter } from './adapters/local';

export interface Release {
	[key: string]: string;
}

/**
 * ArtifactsStore class
 * Used for storing deployment artifacts.
 */
export class ArtifactsStore {
	/**
	 * Creates ArtifactsStore using:
	 * @param {string} archiveStoreURI
	 * @returns {Promise<ArtifactsStore>}
	 */
	public static async create(archiveStoreURI: string): Promise<ArtifactsStore> {
		let adapter: LocalArchiveStoreAdapter;

		if (await localPathUri(archiveStoreURI)) {
			adapter = new LocalArchiveStoreAdapter(archiveStoreURI);
		} else if (gitUri(archiveStoreURI)) {
			throw new NotImplementedError('Git URI support not implemented yet');
		} else {
			throw new UnsupportedError('URI type not supported yet');
		}
		return new ArtifactsStore(adapter);
	}

	private readonly adapter: LocalArchiveStoreAdapter;

	/**
	 * ArtifactsStore constructor
	 * @param {LocalArchiveStoreAdapter} adapter
	 */
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
