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
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as fs from 'mz/fs';
import { dirname, isAbsolute, join, resolve } from 'path';
import {
	FileLoadError,
	NotImplementedError,
	UnsupportedError,
	URILoadError,
} from './error-types';

import { TimeoutError } from 'bluebird';
import * as yaml from 'js-yaml';
import { ConfigMap } from './controllers/config-store/config-store';
import { SSHConnection } from './external/node-ssh-tunnel';

/**
 * Returns an absolute path for a path, when in basePath
 * @param {string} path: The file path, (or an absolute path)
 * @param {string} basePath: The base path
 * @returns {string} An absolute path
 */
export function getAbsolutePath(path: string, basePath: string): string {
	return isAbsolute(path) ? path : join(basePath, path);
}

/**
 * Gets absolute URI
 * @param {string} uri
 * @param {string} basePath
 * @returns {string}
 */
export function getAbsoluteUri(uri: string, basePath: string): string {
	if (isValidGitUri(uri)) {
		throw new NotImplementedError('Git URI support not implemented yet');
	} else if (isLocalPathUri(uri)) {
		return getAbsolutePath(uri, basePath);
	} else {
		throw new UnsupportedError('URI type not supported yet');
	}
}

/**
 * Loads a yaml file as object
 * @param {string} filePath
 * @param {string} errorMessage
 * @returns {Promise<string>}
 */
export async function loadFromFile(
	filePath: string,
	errorMessage: string = '',
): Promise<object> {
	try {
		return yaml.safeLoad(await fs.readFile(filePath, 'utf8'));
	} catch (e) {
		throw new FileLoadError(errorMessage + e.message);
	}
}

/**
 * Checks uri is a valid git URI
 * @param {string} uri
 * @returns {boolean}
 */
export function isValidGitUri(uri: string): boolean {
	return /(?:git|ssh|http|https|git@[\w\.]+):(?:\/\/)?[\w\.@\:/\-]+/.test(uri);
}

/**
 * Checks if uri is a valid local path URI
 * @param {string} uri
 * @returns {boolean}
 */
export function isLocalPathUri(uri: string): boolean {
	return /^[a-zA-Z0-9_/\-.]+$/.test(uri);
}

/**
 * Loads a file in path of URI
 * @param {string} uri
 * @param {string} path
 * @param {string} errorMessage
 * @returns {Promise<string>}
 */
export async function loadFromUri({
	uri,
	path,
	errorMessage,
}: {
	uri: string;
	path: string;
	errorMessage?: string;
}): Promise<object> {
	if (!isLocalPathUri(uri)) {
		throw new URILoadError(`Error loading ${path} from ${uri}`);
	}

	return await loadFromFile(join(uri, path), errorMessage);
}

/**
 * Gets base path of a path
 * @param {string} path
 * @returns {string}
 */
export function getBasePath(path: string): string {
	return dirname(resolve(path));
}

/**
 * Converts relative paths of any object to absolute paths
 * @param {object} conf
 * @param {string} basePath
 * @returns {object}
 */
export function convertRelativePaths({
	conf,
	basePath,
}: {
	conf: any;
	basePath: string;
}): any {
	// Convert relative to absolute URIs
	const keys: Array<_.PropertyPath> = [
		'productRepo',
		'archiveStore',
		'encryptionKeyPath',
		['envFile', 'path'],
		['yamlFile', 'path'],
		['kubernetes', 'kubeConfigPath'],
		['kubernetes', 'bastion', 'key'],
		['compose', 'socket'],
	];

	for (const key of keys) {
		const value = _.get(conf, key);
		if (value) {
			_.set(conf, key, getAbsoluteUri(value, basePath));
		}
	}
	return conf;
}

/**
 * Reads a file from URI
 * @param {string} URI
 * @param {string} path
 * @param {string} cachePath
 * @returns {Promise<string>}
 */
export async function readFromUri({
	uri,
	path,
}: {
	uri: string;
	path: string;
	cachePath?: string;
}): Promise<string> {
	if (!isLocalPathUri(uri)) {
		throw new UnsupportedError('URI type not supported yet');
	}

	return await fs.readFile(join(uri, path), 'utf8');
}

/**
 * Lists a path in a URI
 * @param {string} URI
 * @param {string} path
 * @param {string} cachePath
 * @returns {Promise<string[]>}
 */
export async function listUri({
	uri,
	path,
}: {
	uri: string;
	path: string;
	cachePath?: string;
}): Promise<string[]> {
	if (!isLocalPathUri(uri)) {
		throw new UnsupportedError('URI type not supported yet');
	}

	return await fs.readdir(join(uri, path));
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
	let keyFrame = await loadFromUri({ uri: productRepoURI, path: keyFramePath });

	if (!keyFrame) {
		return {};
	}

	keyFrame = _.filter(
		_.get(keyFrame, ['children', 'sw', 'containerized-application'], []),
		component => component.type === 'sw.containerized-application',
	);
	keyFrame = _.mapValues(_.keyBy(keyFrame, 'slug'), (o: any) => {
		// _.merge(_.get(o, 'assets', {}), { version: _.get(o, 'version') }),
		return { ...o.assets, version: o.version };
	});
	return keyFrame;
}
export type CommandFnOptions = {
	assignedPort: number;
};
export type CommandFn = (config: CommandFnOptions) => Promise<any>;
export type TunnelConfig = {
	host: string;
	port: number;
	localPort: number;
	dstHost: string;
	dstPort: number;
	username: string;
	privateKey: Buffer;
	passphrase?: string;
};
/**
 * Creates an ssh tunnel for executing a promise
 * @param config: ssh2 tunnel configuration object
 * @param command: promise
 * @returns {Promise<any>}
 */
export async function runInTunnel(config: TunnelConfig, command: CommandFn) {
	const {
		host,
		port,
		localPort,
		dstHost,
		dstPort,
		username,
		privateKey,
		passphrase,
	} = config;

	const sshConnection = new SSHConnection({
		endHost: host,
		endPort: port,
		bastionHost: host,
		username,
		privateKey,
		passphrase,
	});

	const { assignedPort } = await sshConnection.forward({
		fromPort: 0,
		toPort: dstPort,
		toHost: dstHost,
	});

	try {
		return await command({
			assignedPort,
		});
	} finally {
		await sshConnection.shutdown();
	}
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
				traverse(value, `${path}.${key}`);
			});
		} else {
			keyPaths.push(_.trimStart(path, '.'));
		}
	}
	traverse(configMap);
	for (const keyPath of keyPaths) {
		// replace period (.) with ___
		ret[_.replace(keyPath, /\./g, '___')] = _.get(configMap, keyPath);
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
