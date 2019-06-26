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
import { remove } from 'fs-extra';
import * as _ from 'lodash';
import * as fs from 'mz/fs';
import { dirname, join } from 'path';
import { Release } from '../artifacts-store';

/**
 * LocalArchiveStoreAdapter class
 * Used for storing deployment artifacts archive.
 */
export class LocalArchiveStoreAdapter {
	private readonly path: string;

	public constructor(path: string) {
		this.path = path;
	}

	/**
	 * Writes a Release locally
	 * @param {Release} release
	 * @returns {Promise<void>}
	 */
	async write(release: Release): Promise<void> {
		// Remove everything from path
		await this.removeAll();
		// write new release
		for (const filePath of _.keys(release)) {
			await this.putFile(filePath, release[filePath]);
		}
	}

	/**
	 * Removes this.path contents recursively
	 * @returns {Promise<void>}
	 */
	private async removeAll(): Promise<void> {
		try {
			const files = await fs.readdir(this.path);
			for (const file of files) {
				await remove(join(this.path, file));
			}
		} catch (e) {
			// ignore missing folders/paths
			if (e.code !== 'ENOENT') {
				throw e;
			}
		}
	}

	/**
	 * Creates a file in the specified path, recursively creating missing parent directories.
	 * @param {string} path
	 * @param {string} data
	 * @returns {Promise<void>}
	 */
	private async putFile(path: string, data: string): Promise<void> {
		fs.mkdirSync(join(this.path, dirname(path)), { recursive: true });
		return await fs.writeFile(join(this.path, path), data);
	}
}
