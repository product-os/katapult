'use strict';

import * as Bluebird from 'bluebird';
import { readFile, readFileSync, writeFile } from 'fs';
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
const writeFileAsync = Bluebird.promisify(writeFile);

export async function loadFromFile(filePath: string): Promise<object> {
	const buffer = await readFileAsync(filePath);
	return yamljs.parse(buffer.toString('utf8'));
}

export function loadFromFileSync(filePath: string): object {
	const buffer = readFileSync(filePath);
	return yamljs.parse(buffer.toString());
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
