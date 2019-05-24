'use strict';

import * as Bluebird from 'bluebird';
import { readdir, readFile, stat, writeFile } from 'fs';
import { filter, get, keyBy, mapValues, merge } from 'lodash';
import { isAbsolute, join } from 'path';
import * as tunnel from 'tunnel-ssh';
import * as yamljs from 'yamljs';

export const statAsync = Bluebird.promisify(stat);
export const readdirAsync = Bluebird.promisify(readdir);
export const readFileAsync = Bluebird.promisify(readFile);
export const tunnelAsync = Bluebird.promisify(tunnel);
export const writeFileAsync = Bluebird.promisify(writeFile);

export async function getDirectories(path: string): Promise<string[]> {
	const directories = (await readdirAsync(path)) as string[];
	return directories.filter(async (name: string) => {
		const itemPath = join(path, name);
		const itemStat = await statAsync(itemPath);
		return itemStat.isDirectory();
	});
}

/**
 * Returns an absolute path for a path, when in basePath
 * @param {string} path: The file path, (or an absolute path)
 * @param {string} basePath: The base path
 * @returns {string} An asolute path
 */
export function getAbsolutePath(path: string, basePath: string): string {
	if (isAbsolute(path)) {
		return path;
	}
	return join(basePath, path);
}

export function getAbsoluteURI(uri: string, basePath: string): string {
	if (gitURI(uri)) {
		throw new Error('Git URI support not implemented yet');
	} else if (localPathURI(uri)) {
		return getAbsolutePath(uri, basePath);
	} else {
		throw new Error('URI type support not implemented yet');
	}
}

export async function loadFromFile(
	filePath: string,
	errorMessage?: string,
): Promise<object> {
	try {
		const buffer = await readFileAsync(filePath);
		return yamljs.parse(buffer.toString('utf8'));
	} catch (e) {
		if (e.code === 'ENOENT' && errorMessage) {
			throw new Error(errorMessage + e.message);
		}
		throw e;
	}
}

export async function writeYaml(
	obj: object,
	filePath: string,
): Promise<object> {
	const data = yamljs.stringify(obj, 40, 2);
	await writeFileAsync(filePath, data, err => {
		if (err) {
			throw err;
		}
	});
	return obj;
}

export function gitURI(uri: string): boolean {
	const re = new RegExp(
		'((git|ssh|http|https)|(git@[\\w\\.]+))(:(//)?)([\\w\\.@\\:/\\-]+)',
	);
	return re.test(uri);
}

export function localPathURI(uri: string): boolean {
	const re = new RegExp('^([a-zA-Z0-9_/\\-.])+$');
	return re.test(uri);
}

export async function loadFromURI(
	URI: string,
	path: string,
	errorMessage?: string,
): Promise<any> {
	// TODO: support git URI
	if (gitURI(URI)) {
		throw new Error('Git URI support not implemented yet');
	} else if (localPathURI(URI)) {
		return await loadFromFile(join(URI, path), errorMessage);
	}
}

export async function readFromURI(
	URI: string,
	path: string,
	cachePath?: string,
): Promise<any> {
	// TODO: support git URI
	if (gitURI(URI)) {
		throw new Error('Git URI support not implemented yet');
	} else if (localPathURI(URI)) {
		return (await readFileAsync(join(URI, path))).toString('utf8');
	}
}

export async function listURI(
	URI: string,
	path: string,
	cachePath?: string,
): Promise<any> {
	// TODO: support git URI
	if (gitURI(URI)) {
		throw new Error('Git URI support not implemented yet');
	} else if (localPathURI(URI)) {
		return await readdirAsync(join(URI, path));
	}
}

/**
 * Keyframe unwrapper to a standard format
 * @param productRepoURI: URI of the product repo
 * @param keyFramePath: path of keyframe
 *
 * returns: Keyframe object
 */
export async function unwrapKeyframe(
	productRepoURI: string,
	keyFramePath: string = './keyframe.yml',
): Promise<object> {
	// TODO: keyframe layering
	let keyFrame = await loadFromURI(productRepoURI, keyFramePath);

	if (keyFrame) {
		keyFrame = filter(
			get(keyFrame, ['children', 'sw', 'containerized-application'], []),
			component => {
				return component.type === 'sw.containerized-application';
			},
		);
		keyFrame = mapValues(keyBy(keyFrame, 'slug'), o => {
			return merge(get(o, 'assets', {}), { version: get(o, 'version') });
		});
		return keyFrame;
	} else {
		return {};
	}
}

/**
 * Creates an ssh tunnel for executing a promise
 * @param tnlConfig: ssh2 tunnel configuration object
 * @param prom: promise
 * @param timeout: tunnel timeout.
 * @returns {Promise<T>}
 */
export async function runInTunnel(tnlConfig: any, prom: any, timeout: number) {
	return tunnelAsync(tnlConfig).then(tnl => {
		const wait = setTimeout(function() {
			tnl.close();
			throw new Error('Timeout exceeded');
		}, timeout);
		return prom.then((ret: any) => {
			clearTimeout(wait);
			if (tnl) {
				tnl.close();
			}
			return ret;
		});
	});
}
