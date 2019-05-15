'use strict';

import * as Bluebird from 'bluebird';
import { readFile, readFileSync, writeFileSync } from 'fs';
import * as yamljs from 'yamljs';

export const configStoreTypes = [
	{ name: 'Kubernetes (secrets in namespace)', value: 'kubernetes' },
	{ name: 'Local environment file', value: 'envfile' },
];

export const deployTargetTypes = [
	{ name: 'Kubernetes', value: 'kubernetes' },
	{ name: 'Docker Socket', value: 'docker' },
	{ name: 'Balena Cloud', value: 'balena' },
];

const readFileAsync = Bluebird.promisify(readFile);

function loadFromFile(filePath: string): Bluebird<any> {
	return readFileAsync(filePath).then(buffer => {
		return yamljs.parse(buffer.toString('utf8'));
	});
}

export function loadFromFileSync(filePath: string): object {
	const buffer = readFileSync(filePath);
	return yamljs.parse(buffer.toString());
}

export function writeYamlSync(obj: object, filePath: string): object {
	const data = yamljs.stringify(obj, 40, 2);
	writeFileSync(filePath, data);
	return obj;
}
