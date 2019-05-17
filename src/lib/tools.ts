'use strict';

import * as Bluebird from 'bluebird';
import { lstat, readdir, readFile, readFileSync, stat, writeFile } from 'fs';
import { join } from 'path';
import * as yamljs from 'yamljs';

const lstatAsync = Bluebird.promisify(lstat);
const readdirAsync = Bluebird.promisify(readdir);
const readFileAsync = Bluebird.promisify(readFile);
const writeFileAsync = Bluebird.promisify(writeFile);

export async function getDirectories(path: string): Promise<string[]> {
	const directories = (await readdirAsync(path)) as string[];
	return directories.filter((name: string) => {
		const itemPath = join(path, name);
		return lstatAsync(itemPath).then(itemStat => {
			return itemStat.isDirectory();
		});
	});
}

export async function loadFromFile(filePath: string): Promise<object> {
	try {
		const buffer = await readFileAsync(filePath);
		return yamljs.parse(buffer.toString('utf8'));
	} catch (e) {
		return {};
	}
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
