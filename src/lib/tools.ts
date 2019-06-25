import * as Bluebird from 'bluebird';
import { readdir, readFile, stat, writeFile } from 'fs';
import * as _ from 'lodash';
import { dirname, isAbsolute, join, resolve } from 'path';
import * as tunnel from 'tunnel-ssh';
import * as yamljs from 'yamljs';
import { ConfigMap } from './controllers/config-store';

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
	return isAbsolute(path) ? path : join(basePath, path);
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
): Promise<any> {
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
	return /((git|ssh|http|https)|(git@[\w\.]+))(:(\/\/)?)([\w\.@\:/\-]+)/.test(
		uri,
	);
}

export function localPathURI(uri: string): boolean {
	return /^([a-zA-Z0-9_/\-.])+$/.test(uri);
}

export async function loadFromURI(
	URI: string,
	path: string,
	errorMessage?: string,
): Promise<any> {
	// TODO: support git URI
	if (gitURI(URI)) {
		throw new Error('Git URI support not implemented yet');
	}
	try {
		if (localPathURI(URI)) {
			return await loadFromFile(join(URI, path), errorMessage);
		}
	} catch (e) {
		const message = `Error loading ${path} from ${URI}\n${e.message}`;
		throw new Error(message);
	}
}

export function getBasePath(path: string) {
	return dirname(resolve(path));
}

export function convertRelativePaths({
	conf,
	basePath,
}: {
	conf: any;
	basePath: string;
}) {
	// Convert relative to absolute URIs
	const keys = [
		'productRepo',
		'archiveStore',
		'encryptionKeyPath',
		'envFile.path',
		'yamlFile.path',
		'kubernetes.kubeConfigPath',
		'kubernetes.bastion.key',
		'compose.socket',
	];

	for (const k of keys) {
		const value = _.get(conf, k);
		if (value) {
			_.set(conf, k, getAbsoluteURI(value, basePath));
		}
	}
	return conf;
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
		keyFrame = _.filter(
			_.get(keyFrame, ['children', 'sw', 'containerized-application'], []),
			component => {
				return component.type === 'sw.containerized-application';
			},
		);
		keyFrame = _.mapValues(_.keyBy(keyFrame, 'slug'), o => {
			return _.merge(_.get(o, 'assets', {}), { version: _.get(o, 'version') });
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

/**
 * Convert a nested configMap object to a flat Key-Value pair configMap
 * @param {ConfigMap} configMap
 * @returns {ConfigMap}
 */
export function configMapToPairs(configMap: ConfigMap): ConfigMap {
	const keyPaths: string[] = [];
	const ret: ConfigMap = {};
	function traverse(configMap: any, path: string = '') {
		if (configMap && _.isObject(configMap)) {
			_.forIn(configMap, function(value: any, key: string) {
				traverse(value, path + '.' + key);
			});
		} else {
			keyPaths.push(_.trimStart(path, '.'));
		}
	}
	traverse(configMap);
	for (const keyPath of keyPaths) {
		ret[_.replace(keyPath, new RegExp('\\.', 'g'), '___')] = _.get(
			configMap,
			keyPath,
		);
	}
	return ret;
}

/**
 * Transforms a key-value pair configMap to a nested configMap object.
 * @param {ConfigMap} configPairs
 * @returns {ConfigMap}
 */
export function kvPairsToConfigMap(configPairs: ConfigMap): ConfigMap {
	for (const key of _.keys(configPairs).sort()) {
		const keyPath = _.split(key, '___');
		_.set(configPairs, keyPath, configPairs[key]);
		// filter out '___' delimited flat keys
		if (keyPath.length > 1) {
			_.unset(configPairs, key);
		}
	}
	return configPairs;
}
